@isTest
private class ContactTaskAutomationLogicTest {
    @TestSetup
    static void makeContactTaskAssignment(){
        Training_Task__c dummyTrainingTask = new Training_Task__c();
        dummyTrainingTask.Expected_Duration_In_Minutes__c = 12;
        dummyTrainingTask.Task_Type__c = 'Meeting';
        insert dummyTrainingTask;  
        
        Training_Task__c dummyTrainingTask2 = new Training_Task__c();
        dummyTrainingTask2.Expected_Duration_In_Minutes__c = 15;
        dummyTrainingTask2.Task_Type__c = 'Meeting';
        insert dummyTrainingTask2; 

        Contact dummyContact = new Contact();
        dummyContact.LastName = 'Smith';
        dummyContact.Start_Date__c = Date.today();
        insert dummyContact;

        Training_Program__c dummyProgram = new Training_Program__c();
        dummyProgram.Name = 'First Program';
        dummyProgram.Duration_in_days__c = 5; 
        insert dummyProgram;

        List<Contact_Task_Assignment__c> testCtaList = new List<Contact_Task_Assignment__c>();
        Contact_Task_Assignment__c testCta = new Contact_Task_Assignment__c();
        testCta.Associated_Program__c = dummyProgram.Id;
        testCta.Contact__c = dummyContact.Id;
        testCta.Due_Day__c = Date.today();
        testCta.Training_Task__c = dummyTrainingTask.Id;
        testCta.Status__c = 'Not Started';
        testCtaList.add(testCta);

        Contact_Task_Assignment__c testCta2 = new Contact_Task_Assignment__c();
        testCta2.Associated_Program__c = dummyProgram.Id;
        testCta2.Contact__c = dummyContact.Id;
        testCta2.Due_Day__c = Date.today();
        testCta2.Training_Task__c = dummyTrainingTask2.Id;
        testCta2.Status__c = 'Not Started';
        testCtaList.add(testCta2);
        insert testCtaList;

        Program_Contact_Assignment__c manipulatedPca = new Program_Contact_Assignment__c();
        manipulatedPca.Start_Date__c = Date.today();
        manipulatedPca.Training_Program__c = dummyProgram.Id;
        manipulatedPca.Contact__c = dummyContact.Id;
        manipulatedPca.Time_Taken__c = 0;
        insert manipulatedPca;
    }

    @isTest 
    static void testSingleRecordUpdateTime() {
        Contact_Task_Assignment__c singleCta = [SELECT Id, Associated_Program__c, Contact__c, Due_Day__c, Training_Task__c, Status__c
                                                        FROM Contact_Task_Assignment__c 
                                                        LIMIT 1];
        singleCta.Status__c = 'Complete';
        update singleCta;

        Program_Contact_Assignment__c updatedPca = [SELECT Id, Time_Taken__c, Contact__c, Training_Program__c
                                                        FROM Program_Contact_Assignment__c
                                                        LIMIT 1];
        System.assertEquals(12, updatedPca.Time_Taken__c);
    }

    @isTest 
    static void testCheckForSubtraction() {
        Contact_Task_Assignment__c singleCta = [SELECT Id, Associated_Program__c, Contact__c, Due_Day__c, Training_Task__c, Status__c
                                                        FROM Contact_Task_Assignment__c 
                                                        LIMIT 1];
        singleCta.Status__c = 'Complete';
        update singleCta;
        singleCta.Status__c = 'In Progress';
        update singleCta;

        Program_Contact_Assignment__c updatedPca = [SELECT Id, Time_Taken__c, Contact__c, Training_Program__c
                                                        FROM Program_Contact_Assignment__c
                                                        LIMIT 1];
        System.assertEquals(0, updatedPca.Time_Taken__c);
    }

    @isTest 
    static void testMultipleRecordUpdateTime() {
        List<Contact_Task_Assignment__c> ctaList = new List<Contact_Task_Assignment__c>();
        List<Contact_Task_Assignment__c> multiCta = [SELECT Id, Associated_Program__c, Contact__c, Due_Day__c, Training_Task__c, Status__c
                                                        FROM Contact_Task_Assignment__c];
        for(Contact_Task_Assignment__c cta:multiCta){
            cta.Status__c = 'Complete';
            ctaList.add(cta);
        }
        update ctaList;

        Program_Contact_Assignment__c updatedPca = [SELECT Id, Time_Taken__c, Contact__c, Training_Program__c
                                                        FROM Program_Contact_Assignment__c
                                                        LIMIT 1];
        System.assertEquals(27, updatedPca.Time_Taken__c);
    }
}
