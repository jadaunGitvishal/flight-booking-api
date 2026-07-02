import nodemailer from "nodemailer";

// ── Transporter ──────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

// Verify on startup
setTimeout(() => {
  createTransporter().verify((err) => {
    if (err) {
      console.warn("⚠️  Email transporter not ready:", err.message);
    } else {
      console.log("✅ Email transporter ready");
    }
  });
}, 1000);

// Verify connection on startup
createTransporter().verify((err) => {
  if (err) {
    console.warn("⚠️  Email transporter not ready:", err.message);
  } else {
    console.log("✅ Email transporter ready");
  }
});

// ── Booking Confirmation Template ─────────────────────────
function bookingConfirmationTemplate({ booking, flight, user }) {
  const passengerRows = (booking.passengerList || [])
    .map(
      (p, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${p.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${p.age}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-transform:capitalize;">${p.gender}</td>
      </tr>`,
    )
    .join("");

  const totalPrice = (flight?.price || 0) * (booking.totalPassengers || 1);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">✈️</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Booking Confirmed!</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Your flight has been booked successfully</p>
    </div>

    <!-- Booking ID -->
    <div style="background:#eff6ff;padding:16px 32px;text-align:center;border-bottom:1px solid #dbeafe;">
      <p style="margin:0;color:#3b82f6;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Booking ID</p>
      <p style="margin:4px 0 0;color:#1e40af;font-size:20px;font-weight:700;font-family:monospace;">${booking._id}</p>
    </div>

    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">
        Hi <strong>${user?.name || "Traveller"}</strong>, your booking is confirmed!
      </p>

      <!-- Flight Info -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">From</p>
            <p style="margin:4px 0 0;color:#1e293b;font-size:22px;font-weight:700;">${flight?.departureCity || "—"}</p>
          </div>
          <div style="color:#3b82f6;font-size:24px;">✈</div>
          <div style="text-align:right;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">To</p>
            <p style="margin:4px 0 0;color:#1e293b;font-size:22px;font-weight:700;">${flight?.arrivalCity || "—"}</p>
          </div>
        </div>
        <div style="border-top:1px dashed #e2e8f0;padding-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Flight</p>
            <p style="margin:4px 0 0;color:#334155;font-size:14px;font-weight:600;">${flight?.flightNumber || "—"}</p>
          </div>
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Airline</p>
            <p style="margin:4px 0 0;color:#334155;font-size:14px;font-weight:600;">${flight?.airline || "—"}</p>
          </div>
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Class</p>
            <p style="margin:4px 0 0;color:#334155;font-size:14px;font-weight:600;">${flight?.flightClass || "—"}</p>
          </div>
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Departure</p>
            <p style="margin:4px 0 0;color:#334155;font-size:14px;font-weight:600;">${flight?.departureDate?.slice(0, 10) || "—"}</p>
          </div>
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Arrival</p>
            <p style="margin:4px 0 0;color:#334155;font-size:14px;font-weight:600;">${flight?.arrivalDate?.slice(0, 10) || "—"}</p>
          </div>
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Passengers</p>
            <p style="margin:4px 0 0;color:#334155;font-size:14px;font-weight:600;">${booking.totalPassengers}</p>
          </div>
        </div>
      </div>

      <!-- Passenger Table -->
      <h3 style="color:#1e293b;font-size:15px;margin:0 0 12px;font-weight:600;">Passenger Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;">#</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;">Name</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;">Age</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;">Gender</th>
          </tr>
        </thead>
        <tbody style="color:#374151;">
          ${passengerRows}
        </tbody>
      </table>

      <!-- Total Price -->
      <div style="background:#eff6ff;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#3b82f6;font-weight:600;">Total Amount Paid</span>
          <span style="color:#1e40af;font-size:22px;font-weight:700;">₹${totalPrice}</span>
        </div>
      </div>

      <!-- Status -->
      <div style="text-align:center;">
        <span style="background:#dcfce7;color:#16a34a;padding:6px 20px;border-radius:999px;font-size:13px;font-weight:600;">
          ✓ Status: Confirmed
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated email from FlightBooker. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Cancellation Template ─────────────────────────────────
function bookingCancellationTemplate({ booking, flight, user, refundDetails }) {
  const totalPrice = (flight?.price || 0) * (booking.totalPassengers || 1);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🚫</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Booking Cancelled</h1>
      <p style="color:#fecaca;margin:8px 0 0;font-size:14px;">Your booking has been cancelled and refund initiated</p>
    </div>

    <!-- Booking ID -->
    <div style="background:#fef2f2;padding:16px 32px;text-align:center;border-bottom:1px solid #fecaca;">
      <p style="margin:0;color:#ef4444;font-size:13px;font-weight:600;text-transform:uppercase;">Cancelled Booking ID</p>
      <p style="margin:4px 0 0;color:#991b1b;font-size:20px;font-weight:700;font-family:monospace;">${booking._id}</p>
    </div>

    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">
        Hi <strong>${user?.name || "Traveller"}</strong>, your booking has been cancelled.
      </p>

      <!-- Flight Summary -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">From</p>
            <p style="margin:4px 0 0;color:#1e293b;font-size:20px;font-weight:700;">${flight?.departureCity || "—"}</p>
          </div>
          <div style="color:#94a3b8;font-size:20px;">→</div>
          <div style="text-align:right;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;">To</p>
            <p style="margin:4px 0 0;color:#1e293b;font-size:20px;font-weight:700;">${flight?.arrivalCity || "—"}</p>
          </div>
        </div>
        <p style="margin:0;color:#64748b;font-size:13px;">
          ${flight?.airline} · ${flight?.flightNumber} · ${flight?.departureDate?.slice(0, 10)}
        </p>
      </div>

      <!-- Refund Details -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;color:#c2410c;font-size:15px;">💰 Refund Details</h3>
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#6b7280;padding:4px 0;">Refund Status</td>
            <td style="color:#16a34a;font-weight:600;text-align:right;">✓ ${refundDetails?.refundStatus || "Processed"}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:4px 0;">Refund Amount</td>
            <td style="color:#1e293b;font-weight:700;text-align:right;">₹${totalPrice}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:4px 0;">Processed At</td>
            <td style="color:#1e293b;text-align:right;">${new Date(refundDetails?.processedAt || Date.now()).toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Status -->
      <div style="text-align:center;">
        <span style="background:#fee2e2;color:#dc2626;padding:6px 20px;border-radius:999px;font-size:13px;font-weight:600;">
          ✗ Status: Cancelled
        </span>
      </div>

      <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:16px;">
        Refunds typically reflect in 5–7 business days depending on your bank.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated email from FlightBooker. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Public Functions ──────────────────────────────────────

export async function sendBookingConfirmation({ booking, flight, user }) {
  try {
    await createTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `✈️ Booking Confirmed — ${flight?.departureCity} → ${flight?.arrivalCity} | ${booking._id}`,
      html: bookingConfirmationTemplate({ booking, flight, user }),
    });
    console.log(`📧 Confirmation email sent to ${user.email}`);
  } catch (err) {
    // Non-blocking — booking never fails if email fails
    console.error("❌ Failed to send confirmation email:", err.message);
  }
}

export async function sendCancellationEmail({
  booking,
  flight,
  user,
  refundDetails,
}) {
  try {
    await createTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `🚫 Booking Cancelled — ${flight?.departureCity} → ${flight?.arrivalCity} | ${booking._id}`,
      html: bookingCancellationTemplate({
        booking,
        flight,
        user,
        refundDetails,
      }),
    });
    console.log(`📧 Cancellation email sent to ${user.email}`);
  } catch (err) {
    console.error("❌ Failed to send cancellation email:", err.message);
  }
}
