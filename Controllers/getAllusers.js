const regUser = require('../Models/registeration');
const jwt = require('jsonwebtoken');

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
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

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
       data,
       dynamicSchoolLink
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
      console.log("User ID from request:", userId);

      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }

      const data = await regUser.findById(userId);
      console.log(data.store_id)
      if (!data) {
          return res.status(404).json({ message: 'Data not found' });
      }
      let role = data.role.toLowerCase();
      let generatedSchoolId = data.schoolId  || data.store_id || data.agent_id; // Use the appropriate ID based on role
      let schoolName = data.schoolName || data.storeName || data.agentName;
      let schoolAddress = data.schoolAddress || data.storeAddress || data.agentAddress;
      let schoolType = data.schoolType || data.storeType || data.agentType;
      let ownership = data.ownership || data.storeOwnership || data.agentOwnership;
      let dynamicSchoolLink = '';

switch (role.toLowerCase()) {
  
  case 'store':
    dynamicSchoolLink = `?store_id=${encodeURIComponent(data.store_id)}&storeName=${encodeURIComponent(data.storeName)}&storeType=${encodeURIComponent(data.storeType)}schoolId=${encodeURIComponent(data.generatedSchoolId)}&schoolName=${encodeURIComponent(data.schoolName)}&schoolAddress=${encodeURIComponent(data.schoolAddress)}&schoolType=${encodeURIComponent(data.schoolType)}&ownership=${encodeURIComponent(data.ownership)}`;
    break;
  case 'school':
    dynamicSchoolLink = `?schoolId=${encodeURIComponent(data.generatedSchoolId)}&schoolName=${encodeURIComponent(data.schoolName)}&schoolAddress=${encodeURIComponent(data.schoolAddress)}&schoolType=${encodeURIComponent(data.schoolType)}&ownership=${encodeURIComponent(data.ownership)}`;
    break;
}

      res.status(200).json({
        message: `User found with the role: ${data.role}`,
        user: {
          data,
          Link: dynamicSchoolLink
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
    console.log("School ID from request:", schoolId); // Log the schoolId for debugging
    const data = await regUser.findById(schoolId);  
    console.log("School data:", data); // Log the school data for debugging
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
    const schoolId = req.user?.id;
    const data = await regUser.findById(schoolId);  
    const agent = await regUser.find({ schoolId: data.schoolId, role: 'agent' });

    if (agent.length === 0) {
      return res.status(404).json({ message: 'No agent found in this school' });
    }

    res.status(200).json({
      message: `Found ${agent.length} agent(s) in school ${data.schoolName}`,
      data: agent
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