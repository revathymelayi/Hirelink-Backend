const asyncHandler = require("express-async-handler")
const User = require("../models/userMdl.js")
const Chats = require("../models/chatMdl.js")
const Message = require('../models/messageMdl.js')
const { USER_ROLE, EMPLOYER_ROLE } = require("../utils/roles.js")
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId

const accesChats = asyncHandler(async function (req, res) {
    const loggedUser = req.user;
    const { userId } = req.query
    console.log(req.user)
    if (!userId) {
        return res.status(400).json({ message: "Could not find the user" })
    }

    let isChat = await Chats.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: loggedUser } } },
            { users: { $elemMatch: { $eq: userId } } },
        ]
    }).populate("users", "-password").populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage",
        select: "name email"
    })

    if (isChat.length > 0) {
        res.status(200).json(isChat[0]);
    } else {
        const chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [loggedUser, userId]
        }

        try {
            const createChat = await Chats.create(chatData);
            const fullChat = await Chats.findOne({ _id: createChat._id }).populate("users", "-password");

            if (fullChat) res.status(200).json(fullChat);
        } catch (error) {
            res.status(200)
            throw new Error(error.message);
        }
    }
});




//fetching the data
const fetchChats = asyncHandler(async function(req, res) {
    try {
        const userId = new mongoose.Types.ObjectId(req.user);
        const userDetails = await User.findById(req.user);
        console.log(userDetails);

        let userList;
        let uniqueUserList = []; // Declare the uniqueUserList here

        if (userDetails.role === USER_ROLE) {
            userList = await User.aggregate([
                {
                    $match: { _id: userId },
                },
                {
                    $lookup: {
                        from: "jobapplies",
                        localField: "_id",
                        foreignField: "userId",
                        as: "jobApplies",
                    },
                },
                {
                    $unwind: "$jobApplies",
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "jobApplies.employerId",
                        foreignField: "_id",
                        as: "employerDetails",
                    },
                },
                {
                    $project: {
                        _id:  "$employerDetails._id",
                        employerId: "$employerDetails._id",
                        firstName: "$employerDetails.firstName",
                        lastName: "$employerDetails.lastName",
                        logo: "$employerDetails.employerdetails.logo"
                       
                    },
                },
            ]);

            // Remove duplicate entries from the userList based on employerId
            const uniqueEmployerIds = [];
            for (const user of userList) {
                if (!uniqueEmployerIds.includes(user.employerId.toString())) {
                    uniqueEmployerIds.push(user.employerId.toString());
                    uniqueUserList.push(user);
                }
            }

            console.log("userSide:", uniqueUserList);
          
        } else if (userDetails.role === EMPLOYER_ROLE) {
            userList = await User.aggregate([
                {
                    $match: { _id: userId },
                },
                {
                    $lookup: {
                        from: "jobapplies",
                        localField: "_id",
                        foreignField: "employerId",
                        as: "jobApplies",
                    },
                },
                {
                    $unwind: "$jobApplies",
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "jobApplies.userId",
                        foreignField: "_id",
                        as: "userDetails",
                    },
                },
                {
                    $project: {
                        _id:  "$userDetails._id",
                        userId: "$userDetails._id",
                        firstName: "$userDetails.firstName",
                        lastName: "$userDetails.lastName",
                       
                        // Add more fields from the "employerDetails" collection if needed
                    },
                },
            ]);

            // Remove duplicate entries from the userList based on userId
            const uniqueUserIds = [];
            for (const user of userList) {
                if (!uniqueUserIds.includes(user.userId.toString())) {
                    uniqueUserIds.push(user.userId.toString());
                    uniqueUserList.push(user);
                }
            }

            console.log("userSide:", uniqueUserList);
            
        }

        const chatList = await Chats.aggregate([
            {
                $match: {
                    users: userId,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "users",
                    foreignField: "_id",
                    as: "usersData",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "groupAdmin",
                    foreignField: "_id",
                    as: "groupAdminData",
                },
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "latestMessage",
                    foreignField: "_id",
                    as: "latestMessageData",
                },
            },
            {
                $sort: { updatedAt: -1 },
            },
        ]);

        const combinedList = uniqueUserList.map(user => ({
            ...user,
            chats: chatList.filter(chat => chat.usersData.find(u => u._id.equals(user._id))),
        }));

        res.status(200).json(combinedList);

    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});



//fetch all messages
const allUsersChats = async (req, res) => {
    if (req.user) {
        try {
            const { chatId } = req.query
            const messages = await Message.find({ chat: new ObjectId(chatId) })
                .populate("sender", "firstName  email")
                .populate("chat");
            res.json({ messages: messages });
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
};

//Send message
const sendMessage = async (req, res) => {
    try {
        if (req.user) {
            const { content, chatId } = req.body;
            console.log(req.body);
            if (!content || !chatId) {
                console.log("Invalid data passed into request");
                return res.sendStatus(400);
            }

            var newMessage = {
                sender: req.user,
                content: content,
                chat: chatId,
            };
            var message = await Message.create(newMessage);

            message = await message.populate("sender", "firstName ")
            message = await message.populate("chat")
            message = await User.populate(message, {
                path: "chat.users",
                select: "firstName  email",
            });

            await Chats.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

            res.json(message);

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}









module.exports = {
    accesChats,
    fetchChats,
    allUsersChats,
    sendMessage
    
}