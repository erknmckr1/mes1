import React, { useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import { useSelector } from "react-redux";
import {
  setIsOpen,
  setCheckBoxMessage,
  setAiChatBoxMessages,
  setAiGeneratedQuery
} from "@/redux/dashboardSlice";
import { useDispatch } from "react-redux";
import axios from "axios";

function ChatBox() {
  const { isOpen, chatBoxMessage, aiChatBoxMessages,aiGeneratedQuery } = useSelector(
    (state) => state.dashboard
  );
  const dispatch = useDispatch();

  const handleChangeChatBoxMessage = (e) => {
    dispatch(setCheckBoxMessage(e.target.value));
  };

  //! send message handler
  const handleSendMessage = async () => {
    if (!chatBoxMessage.trim()) return;
  
    const newUserMessage = { role: "user", message: chatBoxMessage };
    const updatedMessages = [...aiChatBoxMessages, newUserMessage];
  
    dispatch(setAiChatBoxMessages(updatedMessages));
    dispatch(setCheckBoxMessage(""));
  
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ai/ask`,
        { message: chatBoxMessage }
      );
  
      const newAiMessage = {
        role: "ai",
        message: response.data.message,
      };
      console.group(response.data.query)
      dispatch(setAiChatBoxMessages([...updatedMessages, newAiMessage]));
      setAiGeneratedQuery(response.data.query);
    } catch (err) {
      const failMessage = {
        role: "ai",
        message: "Bir hata oluştu lütfen tekrar deneyin",
      };
      dispatch(setAiChatBoxMessages([...updatedMessages, failMessage]));
    }
  };
  
  console.log(aiGeneratedQuery)

  return (
    <>
      {/* Chat Trigger Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
        onClick={() => dispatch(setIsOpen(!isOpen))} // chatbox ı açıp kapatacak buton
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[400px] h-[600px] bg-white border border-gray-300 shadow-xl rounded-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 font-semibold text-lg">
            AI Yardımcı Paneli
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto text-sm text-gray-800 ">
            <div className="space-y-2 p-4 flex-1">
              {aiChatBoxMessages.map((msg, index) => (
                <p
                  key={index}
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-100 self-end"
                      : "bg-gray-300 self-start"
                  }`}
                >
                  {msg.message}
                </p>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              placeholder="Mesaj yazın..."
              onChange={handleChangeChatBoxMessage}
              className="flex-1 text-black border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={chatBoxMessage}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              onKeyDown={handleSendMessage}
            >
              Gönder
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBox;
