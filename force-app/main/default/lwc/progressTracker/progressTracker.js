import { LightningElement, wire, api, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import populateTable from '@salesforce/apex/ProgressTrackerController.populateTable';
import populateModal from '@salesforce/apex/ProgressTrackerTaskModal.populateModal';
import saveTask from '@salesforce/apex/ProgressTrackerTaskModal.saveTask';
import completeTrainingTask from '@salesforce/apex/ProgressTrackerTaskModal.completeTrainingTask';

//The contact owner ID
let owner;

const COLUMNS = [
    {label: 'Program', fieldName: 'Training_Program_URL', type:'url',
        typeAttributes: {
            label: {
                fieldName: 'Training_Program_Name'
            }
        }
    },
    {label: 'Start', fieldName: 'Start_Date'},
    {label: 'End', fieldName: 'End_Date'},
    {label: 'Week', fieldName: 'Week'},
    {label: 'Time Spent On Program in Minutes', fieldName: 'Time_Taken'},
    {label: 'Progress', fieldName:'Progress', type:'text'},
    {label: 'View Tasks', type: 'button',
        typeAttributes:{
            label: 'View Tasks',
            name: 'viewTask',
            title: 'viewTaskTitle',
            disabled: false
        }
    }
];

const MODAL_COLUMNS = [
    {label: 'Task', fieldName: 'Modal_Training_Task_URL', type:'url',
        typeAttributes: {
            label: {
                fieldName: 'Modal_Training_Task_Name'
            }
        }
    },
    {label: 'Status', fieldName: 'Modal_Status'},
    {label: 'Complete?', type: 'button',
        typeAttributes:{
            label: 'Mark Complete',
            name: 'completedTask',
            title: 'completedTaskTitle',
            disabled: false
        }
    },
    {label: 'Blocked?', type: 'button',
        typeAttributes:{
            label: 'Notify Manager',
            name: 'blockedTask',
            title: 'blockedTaskTitle',
            disabled: false
        }
    }
];
export default class ProgressTracker extends LightningElement {
    columns = COLUMNS;
    modalColumns = MODAL_COLUMNS;
    rowOffset = 0;
    searchTimer;
    doneTypingInterval = 300;

    @track taskModal = false;
    @track modalResults;
    @track record;
    @track error;
    @track selectedProgram;
    @track searchText='';
    @track modalSearchText='';

    @api recordId;

    @wire(populateTable, {contactId: '$recordId', searchText:'$searchText'}) tableData({error, data}){
        //Flatten the data so that the program name shows up
        if(data){
            this.record = data.map((element) => ({
                ...element,
                ...{
                    'Training_Program_URL': '/lightning/r/Training_Program__c/'+element.Training_Program__c+'/view',
                    'Training_Program_Name': element.Training_Program__r.Name,
                    'Start_Date': element.Start_Date__c,
                    'End_Date': element.End_Date__c,
                    'Week': element.Week__c,
                    'Time_Taken': element.Time_Taken__c,
                    'Progress': ((!isNaN(element.Time_Taken__c))?Math.floor((element.Time_Taken__c / element.Training_Program__r.Expected_Duration_In_Minutes__c) * 100)+'%':'0%'),
                }
            }));
            this.error = undefined;
        }
        if(error){
            this.error=error;
            this.record = undefined;
        }
    }

    @wire(populateModal, {contactId:'$recordId', programId:'$selectedProgram', searchText:'$modalSearchText'}) modalData({error, data}){
        if(data){
            //Grab the first owner id because even though there may be more than one data entry, the owner of the contact
            // remains the same.
            owner = data[0]["Contact__r"]["ReportsTo"]["Owner"]["Id"];
            this.modalResults = data.map((element) => ({
                ...element,
                ...{
                    'Modal_Training_Task_URL': '/lightning/r/Contact_Task_Assignment__c/'+element.Id+'/view',
                    'Modal_Training_Task_Name': element.Training_Task__r.Name,
                    'Modal_Status': element.Status__c
                }
            }));
            this.error = undefined;
        }
        if(error){
            this.error=error;
            this.modalResults=undefined;
        }
    }

    // Call getRecord in order to return Contact Name for the Task generation
    @wire(getRecord, {recordId: '$recordId', fields:['Contact.Name']}) currContactRecord;

    // Handlers and helpers below this line
    filterHandler(event){
        clearTimeout(this.searchTimer);
        let eventSearchText = event.target.value;
        this.searchTimer = setTimeout(()=>{
            this.searchText = eventSearchText;
        }, this.doneTypingInterval);
    }

    modalFilterHandler(event){
        clearTimeout(this.searchTimer);
        let modalEventSearchText = event.target.value;
        this.searchTimer = setTimeout(()=>{
            this.modalSearchText = modalEventSearchText;
        }, this.doneTypingInterval);
    }

    handleRowAction(event){
        const row = event.detail.row;
        this.setTrainingProgram(row);
        this.taskModal=true;
    }

    handleModalRowAction(event){
        const row = event.detail.row;
        if (event.detail.action.name === 'blockedTask'){
            this.createNewTask(row);
        } else if (event.detail.action.name === 'completedTask'){
            this.completeTask(row);            
        }
    }

    completeTask(row){
        completeTrainingTask({associatedTask: row["Id"]})
                .then(task=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Success",
                            message: "Training Task Marked As Complete",
                            variant: "Success"
                        })
                    );
                })
                .catch(error=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error updating record',
                            message: error.body.message,
                            variant: 'error'
                        })
                    );
                });
    }

    createNewTask(row){
        const subject = this.currContactRecord.data.fields.Name.value + ' is blocked on: ' + row["Training_Task__r"]["Name"];
        const description = '';
        const priority = 'High';
        const type = 'Other';
        saveTask({subject: subject, 
                    description: description, 
                    priority: priority, 
                    type: type, 
                    owner: owner,
                    taskRelatedId: row["Training_Task__c"], 
                    contactId: this.recordId})
            .then(task=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Success",
                        message: "Task Created",
                        variant: "Success"
                    })
                );
            })
            .catch(error=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
        this.closeModal()
    }

    setTrainingProgram(row){
        this.selectedProgram = row["Training_Program__c"];
    }

    closeModal(){
        this.taskModal = false;
        this.modalSearchText = '';
    }
}