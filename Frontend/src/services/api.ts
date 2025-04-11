import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const sendLassoSelectionImage = async (imageData: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/upload-lasso-selection/`,
      { image_data: imageData },
      { headers: { "Content-Type": "application/json" } }
    );
    
    return {
      geminiResponse: response.data.gemini_response || "No response from Gemini",
      success: true
    };
  } catch (error) {
    console.error("Error sending lasso selection:", error);
    return {
      geminiResponse: "Error processing the request.",
      success: false
    };
  }
};