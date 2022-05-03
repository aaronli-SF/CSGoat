import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import saveTask from '@salesforce/apex/ProgressTrackerTaskModal.saveTask';
import completeTrainingTask from '@salesforce/apex/ProgressTrackerTaskModal.completeTrainingTask';
import bulkCompleteTrainingTask from '@salesforce/apex/ProgressTrackerTaskModal.bulkCompleteTrainingTask';
import populateModal from '@salesforce/apex/ProgressTrackerTaskModal.populateModal';

//The contact owner ID
let owner;

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

export default class ProgressModal extends LightningElement {
    searchTimer;
    doneTypingInterval = 300;
    modalColumns = MODAL_COLUMNS;
    rowOffset = 0;

    @api currentContactRecord;
    @api recordId;
    @api selectedProgram;

    @track currentSelectedRows=[];
    @track modalSearchText='';
    @track modalResults;


    @wire(populateModal, {contactId:'$recordId', programId:'$selectedProgram', searchText:'$modalSearchText'}) modalData({error, data}){
        if(data){
            //Grab the first owner id because even though there may be more than one data entry, the owner of the contact
            // remains the same.
            owner = data[0]["Contact__r"]["ReportsTo"]["Owner"]["Id"];
            console.log(owner);
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

    modalFilterHandler(event){
        clearTimeout(this.searchTimer);
        let modalEventSearchText = event.target.value;
        this.searchTimer = setTimeout(()=>{
            this.modalSearchText = modalEventSearchText;
        }, this.doneTypingInterval);
    }

    handleModalRowAction(event){
        const row = event.detail.row;
        if (event.detail.action.name === 'blockedTask'){
            this.createNewTask(row);
        } else if (event.detail.action.name === 'completedTask'){
            this.completeTask(row);            
        }
    }
    
    handleModalRowSelection(){
        const selectedRows = this.template.querySelector('[data-id="modal_table"]').getSelectedRows();
        let incompleteTaskArray=[];

        for (let i = 0; i < selectedRows.length; i++){
            if (!(selectedRows[i]["Status__c"] === 'Complete')){
                incompleteTaskArray.push(selectedRows[i]);
            }
        }
        this.currentSelectedRows = incompleteTaskArray;
    }

    handleMultiComplete(){
        let idList = [];
        for (let i = 0; i < this.currentSelectedRows.length; i++){
            idList.push(this.currentSelectedRows[i]["Id"])
        }
        bulkCompleteTrainingTask({taskList: idList})
            .then(task=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Success",
                        message: "Training Tasks Marked As Complete",
                        variant: "Success"
                    })
                );
            })
            .catch(error=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating records',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
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
        const subject = this.currentContactRecord.fields.Name.value + ' is blocked on: ' + row["Training_Task__r"]["Name"];
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
            //TODO: it works but it doesn't dispatch??
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

    closeModal(){
        this.dispatchEvent(new CustomEvent('close'));
    }
}