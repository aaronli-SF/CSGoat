import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { updateRecord } from 'lightning/uiRecordApi';
// import TIME_TAKEN_IN_MINUTES_FIELD from '@salesforce/schema/Contact_Task_Assignment__c.Time_Taken_In_Minutes__c';
// import ID_FIELD from 'salesforce/schema/Contact_Task_Assignment__c.Id';
import updateTimeTakenInMinutes from '@salesforce/apex/ProgressTrackerTaskModal.updateTimeTakenInMinutes';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

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
    {label: 'Date Completed', fieldName: 'Modal_Date_Completed'},
    {label: 'Time Taken in Minutes', fieldName: 'Modal_Time_Taken_In_Minutes', editable:true, type: 'number',
        typeAttributes:{
            label: 'Time Taken in Minutes',
            name: 'timeTakenInMinutes',
            title: 'timeTakenInMinutesTitle',
            disabled: false
        }
    },
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
    refreshData;

    @api currentContactRecord;
    @api recordId;
    @api selectedProgram;

    @track currentSelectedRows=[];
    @track modalSearchText='';
    @track modalResults;

    @wire(populateModal, {contactId:'$recordId', programId:'$selectedProgram', searchText:'$modalSearchText'}) modalData(result){
        if(result.data){
            //Grab the first owner id because even though there may be more than one data entry, the owner of the contact
            // remains the same.
            owner = result.data[0]["Contact__r"]["ReportsTo"]["Owner"]["Id"];
            this.modalResults = result.data.map((element) => ({
                ...element,
                ...{
                    'Modal_Training_Task_URL': '/lightning/r/Contact_Task_Assignment__c/'+element.Id+'/view',
                    'Modal_Training_Task_Name': element.Training_Task__r.Name,
                    'Modal_Status': element.Status__c,
                    'Modal_Date_Completed': element.Completion_Date__c,
                    'Modal_Time_Taken_In_Minutes': element.Time_Taken_In_Minutes__c
                }
            }));
            this.error = undefined;
            this.refreshData = result;
        }
        
        else if(result.error){
            this.error=result.error;
            this.modalResults=undefined;
        }
    }

    async handleSave(event) {
        const updatedFields = event.detail.draftValues;
        console.log(JSON.stringify(updatedFields));
        // Prepare the record IDs for getRecordNotifyChange()
        const notifyChangeIds = updatedFields.map(row => { return { "recordId": row.Id } });
     
        try {
            // Pass edited fields to the updateContactsTaskAssignment Apex controller
            console.log('entered try statement');
            console.log(JSON.stringify(updatedFields));
            const result = await updateTimeTakenInMinutes({data: updatedFields});
            //console.log(JSON.stringify("Apex update result: "+ result));
            getRecordNotifyChange(notifyChangeIds);
            // Display fresh data in the datatable
            console.log('refreshData = ' + JSON.stringify(this.refreshData));
            await refreshApex(this.refreshData);

            // console.log('refreshedApex');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Time Taken In Minutes updated',
                    variant: 'success'
                })
            );

       } catch(error) {
               this.dispatchEvent(
                   new ShowToastEvent({
                       title: 'Error updating or refreshing records',
                       message: error.body.message,
                       variant: 'error'
                   })
             );
        };
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
                this.closeModal();
            })
            .catch(error=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating records',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
                this.closeModal();
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
                    this.closeModal();
                })
                .catch(error=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error updating record',
                            message: error.body.message,
                            variant: 'error'
                        })
                    );
                    this.closeModal();
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
            .then(task=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Success",
                        message: "Task Created",
                        variant: "Success"
                    })
                );
                this.closeModal();
            })
            .catch(error=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
                this.closeModal();
            });
    }

    closeModal(){
        this.dispatchEvent(new CustomEvent('close'));
    }
}