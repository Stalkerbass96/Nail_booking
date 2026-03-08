import { normalizeEmail } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";

export async function findCustomerByBookingNoAndEmail(bookingNo: string, emailRaw: string) {
  const email = normalizeEmail(emailRaw);

  const appointment = await prisma.appointment.findUnique({
    where: { bookingNo },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!appointment || !appointment.customer.email || normalizeEmail(appointment.customer.email) !== email) {
    return null;
  }

  return {
    appointmentId: appointment.id,
    bookingNo: appointment.bookingNo,
    customer: appointment.customer
  };
}
