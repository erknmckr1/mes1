import React from "react";
import Button from "../ui/Button";
import { setSurveyPopup } from "@/redux/globalSlice";
import { useDispatch } from "react-redux";
function SurveyPopup() {
  const dispatch = useDispatch();
  const handleClosePopup = () => {
    dispatch(setSurveyPopup(false));
  };
  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="w-full h-full bg-black border-2 border-white p-3 static z-50 rounded-md ">
          <div className="h-[7%] w-full mt-1 bg-gray-100 p-1 flex justify-between items-center ">
            <span className="font-semibold">ANKET</span>
            <Button
              className="bg-red-500 hover:bg-red-600"
              children={"KAPAT"}
              onClick={handleClosePopup}
            />
          </div>
          <div className="h-[93%] w-full mt-1 bg-gray-100 ">
            <iframe
              className="w-full h-full"
              src="https://forms.office.com/Pages/ResponsePage.aspx?id=5YXSdhy2x0OfY80KEGckpSV1WN3SxbtCsoFlqMHf6Y5UN1RTNURNQzZDRjVaMTZIVjdKQzJMUVZNSS4u"
              loading="lazy"
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default SurveyPopup;
