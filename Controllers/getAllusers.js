const {regUser,Class} = require('../Models/registeration');
const Wallet = require('../Models/walletSchema');
const jwt = require('jsonwebtoken');


//get all schools
exports.getallSchools = async (req, res) => {
  try {
    const data = await regUser.find({ role: 'school' });
    res.status(200).json({
      message: `${data.length} school(s) found`,
      data: data.map(school => {
        return {
          school_id: school._id,
          schoolName: school.schoolName,
          schoolAddress: school.schoolAddress,
          schoolType: school.schoolType
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


exports.getallUsers =  async (req, res) => {
  try {
    const data = await regUser.find();
    res.status(200).json({
      message: `${data.length} user(s) found`,
      data: data.map(user => {
        let roleSpecificId = {};
        const userRole = user.role.toLowerCase();

        if (userRole === 'student') {
          roleSpecificId.student_id = `${user.schoolId}/${user._id}`;
        } else if (userRole === 'agent') {
          roleSpecificId.agent_id = `${user.store_id}/${user._id}`;
        } else if (userRole === 'store') {
          roleSpecificId.store_id = `${user.schoolId}/${user._id}`;
        }

        if (userRole === 'school') {
          roleSpecificId.schoolId = user.schoolId;
          const generatedSchoolLink = `/?schoolId=${encodeURIComponent(user.schoolId)}&schoolName=${encodeURIComponent(user.schoolName)}&schoolAddress=${encodeURIComponent(user.schoolAddress)}&schoolType=${encodeURIComponent(user.schoolType)}&ownership=${encodeURIComponent(user.ownership)}`;
          
          return {
            user,
            ...roleSpecificId,
            schoolRegistrationLink: generatedSchoolLink,
          };
        } else if (userRole === 'store') {
          const generatedStoreLink = `/?store_id=${encodeURIComponent(user.store_id)}&storeName=${encodeURIComponent(user.storeName)}&storeType=${encodeURIComponent(user.storeType)}`;
          
          return {
            user,
            ...roleSpecificId,
            storeRegistrationLink: generatedStoreLink,
          };
        }

        // Default return for other roles
        return {
          user,
          ...roleSpecificId,
          academicDetails: {
            classAdmittedTo: user.Class,
            section: user.section,
            previousSchool: user.previousSchool,
          }
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
exports.getAllStudents = async (req, res) => {
  try {
    const students = await regUser.find({ role: 'student' })
      .populate({
        path: 'Class',
        select: 'className section description',
      })
      .select('-password -pin -refreshToken'); // Hide sensitive info

      //get student class details
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found' });
    }
    
    res.status(200).json({
      success: true,
      total: students.length,
      data: students.map(student => {
        return {
          student_id: student._id,
          class: student.Class ? student.academicDetails.classAdmittedTo : 'N/A',
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: student.name,
          role: student.role,
          email: student.email,
          phone: student.phone,
        };
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMyChild = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    } 
    // Find the user to get their email
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Find students where guardian email matches user's email
    const students = await regUser.find({ role: 'student', 'guardian.email': user.email })
      .populate({
        path: 'Class',
        select: 'className section description',
      })
      .select('-password -pin -refreshToken'); // Hide sensitive info

      //get student class details
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found' });
    }
    
    res.status(200).json({
      success: true,
      total: students.length,
      data: students.map(student => {
        return {
          student_id: student._id,
          class: student.Class ? student.academicDetails.classAdmittedTo : 'N/A',
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: student.name,
          role: student.role,
          email: student.email,
          phone: student.phone,
        };
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



exports.getuserbyid = async (req, res) => {
  try {
      const userId = req.params.id; // Get userId from request parameters
      console.log("User ID from request:", userId); // Log the userId for debugging
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }
      // Find the user by ID
      const data = await regUser.findById(userId)
      console.log("User data:", data.id); // Log the user data for debugging
      if (!data) {
          return res.status(404).json({ message: 'Data not found' });
      }
      res.status(200).json({
        message: `user found with the role: ${data.role}`,
       data
      });
  }
  catch (error) {
      res.status(500).json({ message: error.message });
  }
}
// exports.getuser = async (req, res) => {
//   try {
//       const userId = req.user?.id; // Get userId from request parameters
//       console.log("User ID from request:", userId); // Log the userId for debugging
//       if (!userId) {
//           return res.status(400).json({ message: 'User ID is required' });
//       }
//       // Find the user by ID
//       const data = await regUser.findById(userId)
//       console.log("User data:", data.id); // Log the user data for debugging
//       if (!data) {
//           return res.status(404).json({ message: 'Data not found' });
//       }
//       res.status(200).json({
//         message: `user found with the role: ${data.role}`,
//        data
//       });
//   }
//   catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// }
// exports.getuser = async (req, res) => {
//   try {
//       const userId = req.user?.id; // <-- Get userId from URL params
//       console.log("User ID from request:", userId);

//       if (!userId) {
//           return res.status(400).json({ message: 'User ID is required' });
//       }

//       const data = await regUser.findById(userId);
//       if (!data) {
//           return res.status(404).json({ message: 'Data not found' });
//       }
//       let role = data.role.toLowerCase();
//       let generatedSchoolId = data.schoolId || data.store_id || data.agent_id; // Use the appropriate ID based on role
//       let schoolName = data.schoolName || data.storeName || data.agentName;
//       let schoolAddress = data.schoolAddress || data.storeAddress || data.agentAddress;
//       let schoolType = data.schoolType || data.storeType || data.agentType;
//       let ownership = data.ownership || data.storeOwnership || data.agentOwnership;
//       let dynamicSchoolLink = '';

// switch (role.toLowerCase()) {
  
//   case 'store':
//     dynamicSchoolLink = `/?store_id=${encodeURIComponent(store_id)}&storeName=${encodeURIComponent(storeName)}&storeType=${encodeURIComponent(storeType)}`;
//     break;
//   case 'school':
//     dynamicSchoolLink = `/students/new?schoolId=${encodeURIComponent(generatedSchoolId)}&schoolName=${encodeURIComponent(schoolName)}&schoolAddress=${encodeURIComponent(schoolAddress)}&schoolType=${encodeURIComponent(schoolType)}&ownership=${encodeURIComponent(ownership)}`;
//     break;
// }

//       res.status(200).json({
//         message: `User found with the role: ${data.role}`,
//         user: {
//           data,
//           schoolLink: dynamicSchoolLink
//         },

//       });
//   }
//   catch (error) {
//       res.status(500).json({ message: error.message });
//   }
// }

exports.getuser = async (req, res) => {
  try {
      const userId = req.user?.id; // <-- Get userId from URL params
      // console.log("User ID from request:", userId);
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }
      
      const data = await regUser.findById(userId);
      //get school info for store, agent and students
      const schoolInfo = await regUser.findOne({ schoolId: data.schoolId, role: 'school' });
      const studentCanTransfer = schoolInfo ? schoolInfo.schoolCanTransfer : false;
      const schoolCanWithdraw = schoolInfo ? schoolInfo.schoolCanWithdraw : false;
      const storeCanTransfer = data.storeCanTransfer || false;
      const storeCanWithdraw = data.storeCanWithdraw || false;
      const agentCanTransfer = data.agentCanTransfer || false;
      const agentCanWithdraw = data.agentCanWithdraw || false;
      const studentCanTopup = data.studentCanTopup || false;
      const storeCanTopup = data.storeCanTopup || false;
      const agentCanTopup = data.agentCanTopup || false;
      const schoolCanTopup = schoolInfo ? schoolInfo.schoolCanTopup : false;
      const wallet = await Wallet.findOne({ userId: data._id });
      if (!data) {
          return res.status(404).json({ message: 'Data not found' });
      }
      let role = data.role.toLowerCase();
      let generatedSchoolId = data.schoolId  || data.store_id || data.agent_id; // Use the appropriate ID based on role
      let Name = data.schoolName || data.storeName || data.agentName;
      let Address = data.schoolAddress || data.storeAddress || data.agentAddress;
      let Type = data.schoolType || data.storeType || data.agentType;
      let ownership = data.ownership || data.storeOwnership || data.agentOwnership;
      let dynamicSchoolLink = '';

switch (role.toLowerCase()) {
  
  case 'store':
    dynamicSchoolLink = `?store_id=${encodeURIComponent(data.store_id)}&storeName=${encodeURIComponent(data.storeName)}&storeType=${encodeURIComponent(data.storeType)}schoolId=${encodeURIComponent(data.generatedSchoolId)}&schoolName=${encodeURIComponent(data.schoolName)}&schoolAddress=${encodeURIComponent(data.schoolAddress)}&schoolType=${encodeURIComponent(data.schoolType)}&ownership=${encodeURIComponent(data.ownership)}`;
    break;
  case 'school':
    dynamicSchoolLink = `?schoolId=${encodeURIComponent(generatedSchoolId)}&schoolName=${encodeURIComponent(Name)}&schoolAddress=${encodeURIComponent(Address)}&schoolType=${encodeURIComponent(Type)}&ownership=${encodeURIComponent(ownership)}`;
    break;
}
//give response with user data and dynamic link base d on role
      // Remove sensitive information from the response
      const { pin, password, ...safeUser} = data.toObject();
      //add studentCanTransfer, schoolCanWithdraw, storeCanTransfer, storeCanWithdraw, agentCanTransfer, agentCanWithdraw to safeUser
      safeUser.studentCanTransfer = studentCanTransfer;
      safeUser.schoolCanWithdraw = schoolCanWithdraw;
      safeUser.storeCanTransfer = storeCanTransfer;
      safeUser.storeCanWithdraw = storeCanWithdraw;
      safeUser.agentCanTransfer = agentCanTransfer;
      safeUser.agentCanWithdraw = agentCanWithdraw;
      safeUser.studentCanTopup = studentCanTopup;
      safeUser.storeCanTopup = storeCanTopup;
      safeUser.agentCanTopup = agentCanTopup;
      safeUser.schoolCanTopup = schoolCanTopup;
      // Remove sensitive information from the response
      // Use toObject() to convert Mongoose document to plain object
      // This allows us to safely remove properties without affecting the original document
// const { pin, password, ...safeUser} = data;

      res.status(200).json({
        message: `User found with the role: ${data.role}`,
        user: {
          data:safeUser,
          wallet: {
            balance: wallet ? wallet.balance : 0,
            currency: wallet ? wallet.currency : 'NGN',
            walletId: wallet ? wallet._id : null,
          },
          schoolLink: dynamicSchoolLink
        },
      });
  }
  catch (error) {
      res.status(500).json({ message: error.message });
  }
}

// exports.getuser = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     console.log("User ID from request:", userId);

//     if (!userId) {
//       return res.status(400).json({ message: 'User ID is required' });
//     }

//     const data = await regUser.findById(userId);
//     if (!data) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const role = data.role?.toLowerCase();
//     const schoolInfo = {
//       id: data.schoolId || data.store_id || data.agent_id,
//       name: data.schoolName || data.storeName || data.agentName,
//       address: data.schoolAddress || data.storeAddress || data.agentAddress,
//       type: data.schoolType || data.storeType || data.agentType,
//       ownership: data.ownership || data.storeOwnership || data.agentOwnership,
//     };

//     let registrationLinks = {};

//     const jwtSecret = process.env.JWT_SECRET_KEY_LINK_GEN;
//     console.log("JWT Secret:", jwtSecret); // Log the JWT secret for debugging
//     if (!jwtSecret || jwtSecret.length > 7) {
//       return res.status(400).json({ message: 'JWT_SECRET should be 7 characters or less' });
//     }

//     if (role === 'school') {
//       const studentToken = jwt.sign({ ...schoolInfo, role: 'student' }, jwtSecret);
//       const storeToken = jwt.sign({ ...schoolInfo, role: 'store' }, jwtSecret);

//       registrationLinks.studentRegistration = `https://yourfrontend.com/signup?token=${studentToken}`;
//       registrationLinks.storeRegistration = `https://yourfrontend.com/signup?token=${storeToken}`;
//     }

//     if (role === 'store') {
//       const agentToken = jwt.sign({ ...schoolInfo, role: 'agent' }, process.env.JWT_SECRET, { expiresIn: '15m' });

//       registrationLinks.agentRegistration = `https://yourfrontend.com/signup?token=${agentToken}`;
//     }

//     res.status(200).json({
//       message: `User found with the role: ${data.role}`,
//       user: {
//         data,
//         registrationLinks
//       }
//     });

//   } catch (error) {
//     console.error('Get User Error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };


//Get all students in a school
exports.getAllStudentsInSchool = async (req, res) => {
  try {
    const schoolId = req.user?.id;
    const data = await regUser.findById(schoolId);  
    const students = await regUser.find({ schoolId: data.schoolId, role: 'student' });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this school' });
    }

    res.status(200).json({
      message: `Found ${students.length} student(s) in school ${data.schoolName}`,
      data: students
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllStudentsCountInSchool = async (req, res) => {
  try {
    const schoolId = req.user?.id;
    const data = await regUser.findById(schoolId);  
    const students = await regUser.find({ schoolId: data.schoolId, role: 'student' });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this school' });
    }

    res.status(200).json({
      message: `Found ${students.length} student(s) in school ${data.schoolName}`,
      data: students.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllAgentsInSchool = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const data = await regUser.findById(userId);  
    const schoolId = data.store_id || data.schoolId // Use the appropriate ID based on role
    console.log("School ID:", schoolId); // Log the schoolId for debugging
    if (!schoolId) {
      return res.status(400).json({ message: 'School or Store ID is required' });
    }
    const agent = await regUser.find({ store_id: data.store_id, role: 'agent' });

    if (agent.length === 0) {
      return res.status(404).json({ message: 'No agent found in this school' });
    }
    //format the agent data
    const formattedAgents = agent.map(agent => ({
      id: agent._id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      fullName: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role
    }));
    res.status(200).json({
      message: `Found ${agent.length} agent(s) in school ${data.storeName}`,
      data: {
        agent: formattedAgents,
        schoolId: data.schoolId,
       store: {
          id: data._id,
          name: data.storeName,
          type: data.storeType,
          address: data.storeAddress,
          store_id: data.store_id
        },
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllAgentsInSchoolCount = async (req, res) => {
  try {
    const schoolId = req.user?.id;
    const data = await regUser.findById(schoolId);  
    const agent = await regUser.find({ schoolId: data.schoolId, role: 'agent' });

    if (agent.length === 0) {
      return res.status(404).json({ message: 'No agent found in this school' });
    }

    res.status(200).json({
      message: `Found ${agent.length} agent(s) in school ${data.schoolName}`,
      data: agent.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllStoreInSchoolCount = async (req, res) => {
  try {
    const schoolId = req.user?.id;
    const data = await regUser.findById(schoolId);  
    const store = await regUser.find({ schoolId: data.schoolId, role: 'store' });

    if (store.length === 0) {
      return res.status(200).json({ message: `Found ${store.length} store(s) in ${data.schoolName}`,data:store.length });
    }

    res.status(200).json({
      message: `Found ${store.length} store(s) in school ${data.schoolName}`,
      data: store.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllStoreInSchool = async (req, res) => {
  try {
    const schoolId = req.user?.id;
    const data = await regUser.findById(schoolId);  
    const store = await regUser.find({ schoolId: data.schoolId, role: 'store' });

    if (store.length === 0) {
      return res.status(404).json({ message: 'No store found in this school' });
    }

    res.status(200).json({
      message: `Found ${store.length} store(s) in school ${data.schoolName}`,
      data: store
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//filter by
exports.getUserByFilter = async (req, res) => {
  try {
    const { id, role, schoolId, firstName, lastName,student_id,store_id } = req.query;

    // Build query object dynamically
    let query = {};

    if (id) query._id = id;
    if (role) query.userId = role;
    if (schoolId) query.schoolId = schoolId;
    if (firstName) query.firstName = firstName;
    if (lastName) query.lastName = lastName;
    if (student_id) query.student_id = student_id;
    if (store_id) query.store_id = store_id;

    console.log("Query object:", query); // Log the query object for debugging
    const user = await regUser.find(query);
    res.status(200).json({ status: true, data: user });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({ status: false, message: 'Server error fetching wallets' });
  }
};