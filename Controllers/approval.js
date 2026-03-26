const mongoose = require('mongoose');
const {regUser, Approval} = require('../Models/registeration'); 
const {Resend} = require('resend')


exports.requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user?.id;
    if(!userId){
        return res.status(401).json({ message: "Forbidden: You are not authorized" });

    }

    const id = req.params.id;
        if (userId !== id) {
            return res.status(401).json({ message: "Forbidden: You are not authorized to delete this user" });
        }

    const user = await regUser.findById(userId)

    // Prevent duplicate requests
    const existing = await Approval.findOne({
      type: "DELETE_ACCOUNT",
      requestedBy: userId,
      status: "PENDING"
    });

    if (existing) {
      return res.status(400).json({
        message: "You already have a pending delete request"
      });
    }

    const approval = await Approval.create({
      type: "DELETE_ACCOUNT",
      requestData: { userId },
      requestedBy: userId
    });

    const templatePath = path.join(__dirname, "../Re_envrionment files/account_deletion.html");
  const htmlTemplate = fs.readFileSync(templatePath, "utf8");

  const banner = `${process.env.BACKENDURL}/images/xpay1024X500.png`
    const logo = `${process.env.BACKENDURL}/images/xpaylogo.png`
    

    const resend = new Resend(process.env.RESEND_API_KEY); 
        const { data, error } = await resend.emails.send({
            from: "itsupport@creastech.com",
            to: "itsupport@creastech.com",
            subject: "LogAccount Deletion Request",
            html:htmlTemplate
            .replace("{{firstName}}", user.firstName)
            .replace("{{logo}}", logo)
          });
    
          if (error) {
            console.error("Email sending failed:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to send email"
            });
          }


    res.json({
      message: "Account deletion request submitted for approval",
      approvalId: approval._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};