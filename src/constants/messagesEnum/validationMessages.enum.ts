export enum ValidationMessagesEnum {
  FIRST_NAME = 'Name should be a string with max length of 40 characters',
  LAST_NAME = 'Last name should be a string with max length of 40 characters',
  EMAIL = 'Email should be valid',
  PASSWORD = 'Password should consist of at least one letter,' +
    ' one digit and have length between 8  and 59 characters. Example: Password123.',
  CONFIRM_PASSWORD = 'Password and confirm password should match.',
  HOUSEHOLD_ID = 'UUID of household',
  CONTACT_ID = 'UUID of contact',
  USER_ID = 'UUID of user',
  MESSAGE_BODY = 'Text you want to send to household',
  PHONE = 'This has to be valid phone +38066666666 15 symbols max',
  ACTION = 'Action has to be boolean (add = true , delete = false)',
  PERMISSION = 'villager | grandparent'
}
