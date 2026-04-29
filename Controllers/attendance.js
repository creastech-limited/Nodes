// controllers/attendanceController.js
// const AttendanceLog = require("../Models/registeration");
// const QrToken = require("../models/QrToken");
const mongoose = require('mongoose');
const {regUser, AttendanceLog} = require("../Models/registeration");



exports.scanQr = async (req, res) => {
  try {
    const userId = req.user?.id
    console.log(userId)
    if (!userId) {
      return res.status(404).json({ message: "Unauthorised" })
    }

    const user = await regUser.findById(userId)
    // console.log("user:", user)
     if(!user && user.status !== "Active"){
      return res.status(404).json({ message: "User not present or User not active" })
    }
    
    const { studentEmail, deviceId, location,} = req.body;
    const schoolId = user.schoolId
    // if (!token) {
    //   return res.status(400).json({ message: "QR token is required" });
    // }

    // // 1. Validate QR Token
    // const qr = await QrToken.findOne({ token, isActive: true }).populate("student");

    // if (!qr) {
    //   return res.status(404).json({ message: "Invalid or inactive QR code" });
    // }

    // const student = qr.student;
    const student = await regUser.findOne({email: studentEmail, schoolId: schoolId});
    if(!student){
      return res.status(404).json({ message: "Student not available in this school" })
    }
    // 2. Get last attendance record
    const lastLog = await AttendanceLog.findOne({ student: student.id })
      .sort({ timestamp: -1 });

    let newType = "IN";

    if (lastLog) {
      // Alternate logic
      newType = lastLog.type === "IN" ? "OUT" : "IN";
    }

    // 3. Prevent duplicate scan within short time (anti double scan)
    if (lastLog) {
      const diff = (Date.now() - new Date(lastLog.timestamp)) / 1000;

      if (diff < 30) {
        return res.status(400).json({
          message: "Duplicate scan detected. Please wait a few seconds.",
        });
      }
    }

    // 4. Create new attendance log
    const newLog = await AttendanceLog.create({
      student: student._id,
      type: newType,
      location: location || "Main Gate",
      deviceId,
    });

    // 5. (Optional) Update user status
    student.attendanceStatus = newType;
    await student.save();

    return res.status(200).json({
      message: `Scan successful - ${newType}`,
      data: {
        student: {
          id: student._id,
          name: student.name,
          pics: student.profilePicture
        },
        type: newType,
        time: newLog.timestamp,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const logs = await AttendanceLog.find({ student: studentId })
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const logs = await AttendanceLog.find({
      timestamp: { $gte: start },
    }).populate("student", "name");

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching today's attendance" });
  }
};