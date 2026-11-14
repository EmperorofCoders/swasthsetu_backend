import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
);
    
// Pass the logged-in user's Clerk ID and their locked patientProfile object as props
export default function BookAppointment({ clerkUserId, patientProfile }) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();

      // 1. Style the embedded calendar
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#2563eb" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      // 2. Listen for when the patient finishes booking an appointment
      cal("on", {
        action: "bookingSuccessful",
        callback: async (e) => {
          const bookingData = e.detail.data;

          // Save the confirmed appointment directly into Supabase!
          const { error } = await supabase.from("appointments").insert([
            {
              clerk_user_id: clerkUserId,
              patient_code: patientProfile.patient_code, // e.g. "RONI4420209"
              doctor_or_event: bookingData.title || "General Consultation",
              start_time: bookingData.startTime,
              end_time: bookingData.endTime,
              cal_booking_uid: bookingData.uid || "",
              status: "Confirmed",
            },
          ]);

          if (!error) {
            alert("Appointment booked and saved to your medical profile!");
          } else {
            console.error("Failed to save appointment:", error.message);
          }
        },
      });
    })();
  }, [clerkUserId, patientProfile]);

  return (
    <div style={{ width: "100%", minHeight: "650px" }}>
      <Cal
        // Replace with your own username/event-slug from Step 1
        calLink="your-username/doctor-consultation"
        style={{ width: "100%", height: "100%", overflow: "scroll" }}
        config={{
          layout: "month_view",
          // Automatically pre-fills the patient's details in the booking screen!
          name: patientProfile?.patient_name || "",
          email: patientProfile?.email || "",
          notes: `Patient Code: ${patientProfile?.patient_code} | Allergies: ${patientProfile?.allergies || "None"}`,
        }}
      />
    </div>
  );
}