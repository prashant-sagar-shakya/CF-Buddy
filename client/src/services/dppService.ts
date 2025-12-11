import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://cf-buddy.onrender.com/api/dpp";

export const saveDpp = async (dppData: any) => {
  try {
    const response = await axios.post(API_URL, dppData);
    return response.data;
  } catch (error) {
    console.error("Error saving DPP:", error);
    throw error;
  }
};

export const getCalendarData = async (userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/calendar/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    throw error;
  }
};

export const getDppByDate = async (userId: string, date: string) => {
  try {
    const response = await axios.get(`${API_URL}/${userId}/${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching DPP:", error);
    throw error;
  }
};
