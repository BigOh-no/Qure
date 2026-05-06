import { supabaseClient } from "../lib/supabaseClient";
import { getTodayQueueForClinic } from "./queueService";

export async function getStaffClinicAndQueue(){
    try{
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;
        
        const { data: staff, error: staffError } = await supabaseClient
            .from("clinicStaff")
            .select("clinic_id")
            .eq("staff_id",user.id)
            .single();
                
        if (staffError) throw staffError;
        
        const { data: clinic, error: clinicError } = await supabaseClient
            .from("clinics")
            .select("facility_name")
            .eq("id",staff.clinic_id)
            .single();
        if (clinicError) throw clinicError;
        const queue = await getTodayQueueForClinic(staff.clinic_id);
        return {
            clinicName: clinic.facility_name,
            patients: queue,
        };
    } catch (error){
        console.error(error);
    }
}

export async function updateQueueStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient
        .from("queue_entries")
        .update({status: newStatus})
        .eq("id", id);
        
        if (error) throw error;
        return true;
    }
    catch (err){
        console.error(err);
    }
}

export async function getClinicAppointments() {
    try{
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;

        const { data, error } = await supabaseClient
            .from("appointments")
            .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            patient_user_id
            `)
            .eq("clinic_id", user.clinic_id)
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        if (error) throw error;
        return data || [];
    }
    catch(err){
        console.error(err);
    }
}

export async function staffCreateAppointment({
    patientUserId,
    appointmentDate,
    appointmentTime,
}) {
    try{
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;

        const { data, error } = await supabaseClient
            .from("appointments")
            .insert([
            {
                patient_user_id: patientUserId,
                clinic_id: user.clinic_id,
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                status: "booked",
            },
            ])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    catch(err){
        console.error(err);
    }
}

export async function staffCancelAppointment(appointmentId){
    try{
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;

        const { data, error } = await supabaseClient
            .from("appointments")
            .update({ status: "cancelled" })
            .eq("id", appointmentId)
            .eq("clinic_id", user.clinic_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
    catch(err){
        console.error(err);
    }
}

export async function staffRescheduleAppointment({
    appointmentId,
    appointmentDate,
    appointmentTime,
}) {
    try{
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();
        
        if (userError) throw userError;

        const { data, error } = await supabaseClient
            .from("appointments")
            .update({
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            status: "booked",
            })
            .eq("id", appointmentId)
            .eq("clinic_id", user.clinic_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
    catch(err){
        console.error(err);
    }
}