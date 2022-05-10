import { LightningElement, wire, api, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

import populateTable from '@salesforce/apex/ProgressTrackerController.populateTable';


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


export default class ProgressTracker extends LightningElement {
    columns = COLUMNS;
    rowOffset = 0;
    searchTimer;
    doneTypingInterval = 300;

    @track taskModal = false;
    @track record;
    @track error;
    @track selectedProgram;
    @track searchText='';
    @track currentContactRecord;

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


    // Call getRecord in order to return Contact Name for the Task generation
    @wire(getRecord, {recordId: '$recordId', fields:['Contact.Name']}) currContactRecord({error, data}){
        if(data){
            this.currentContactRecord = data;
            this.error = undefined;
        }
        if(error){
            this.error=error;
            this.currentContactRecord=undefined;
        }
    }

    // Handlers and helpers below this line
    filterHandler(event){
        clearTimeout(this.searchTimer);
        let eventSearchText = event.target.value;
        this.searchTimer = setTimeout(()=>{
            this.searchText = eventSearchText;
        }, this.doneTypingInterval);
    }

    handleRowAction(event){
        const row = event.detail.row;
        this.setTrainingProgram(row);
        this.taskModal=true;
    }

    setTrainingProgram(row){
        this.selectedProgram = row["Training_Program__c"];
    }

    closeHandler(){
        this.taskModal=false;
    }
}