//services/admin.service.js
import Hod from '../models/Hod.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Warden from '../models/Warden.js';
import Guard from '../models/Guard.js';
import bcrypt from 'bcryptjs';
import { generatePassword } from '../utils/generatePassword.js';
import { sendCredentialsEmail } from './email.service.js';
const roleModelMap = {
  hod: Hod,
  faculty: Faculty,
  student: Student,
  warden: Warden,
  guard: Guard,
};

export const addUsers = async ({ users, role }) => {
  const Model = roleModelMap[role];
  if (!Model) throw new Error("Invalid role");
 
   
let finalUsers = [];

function convertExcelDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400; // seconds in a day
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0]; // yyyy-mm-dd
}

if (role === "student") {
  finalUsers = users.map(user => {
    const { 
      ['hostel name']: name, 
      ['hostel roomNumber']: roomNumber,
      ['Semester Start Date']: semesterStartDate,
      ['Semester End Date']:  semesterEndDate,
      ...rest 
    } = user;

    return {
      ...rest,
      semesterStartDate: convertExcelDate(semesterStartDate),
      semesterEndDate: convertExcelDate(semesterEndDate),
      hostel: {
        name,
        roomNumber
      }
    };
  });
   for (const user of finalUsers) {
    const password = generatePassword(user.name, user.email);
    const hashedPassword = await bcrypt.hash(password, 10);

    const userDoc = new Model({
      ...user,
     password: hashedPassword,
     role,
    });

   await userDoc.save();
    await sendCredentialsEmail({ email: user.email, name: user.name, password,role:role });
   }
}

if(role=="faculty"){
    for(const user of users){
      const password=generatePassword(user.name,user.email);
      const hashedPassword=await bcrypt.hash(password,10);
      const facultyDoc=new Model({
        ...user,
        password:hashedPassword
      })
      await facultyDoc.save(); 

      await sendCredentialsEmail({ email: user.email, name: user.name, password,role:role });
    }
}

if(role=="hod"){
  for(const user of users){
      const password=generatePassword(user.name,user.email);
      const hashedPassword=await bcrypt.hash(password,10);
      const hodDoc=new Model({
        ...user,
        password:hashedPassword
      })
      await hodDoc.save(); 

        await sendCredentialsEmail({ email: user.email, name: user.name, password,role:role });
    }
}

if(role=="warden"){
  for(const user of users){
      const password=generatePassword(user.name,user.email);
      const hashedPassword=await bcrypt.hash(password,10);
      const wardenDoc=new Model({
        ...user,
        password:hashedPassword
      })
      await wardenDoc.save(); 

       await sendCredentialsEmail({ email: user.email, name: user.name, password,role:role });
    }
}

if(role=="guard"){
  for(const user of users){
      const password=generatePassword(user.name,user.email);
      const hashedPassword=await bcrypt.hash(password,10);
      const guardDoc=new Model({
        ...user,
        password:hashedPassword
      })
      await guardDoc.save(); 

        await sendCredentialsEmail({ email: user.email, name: user.name, password,role:role });
    }
}


 



  

  return { message: `${users.length} ${role}s added successfully.` };
};
