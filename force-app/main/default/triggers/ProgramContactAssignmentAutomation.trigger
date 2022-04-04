trigger ProgramContactAssignmentAutomation on Program_Contact_Assignment__c (after insert) {
   if(Trigger.isInsert && Trigger.isAfter){
       ProgramContactAssignmentHandler.isAfterInsert();
   }
}