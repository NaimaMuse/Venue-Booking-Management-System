import { formatDate, getUser } from './auth';

const money = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const buildBookingInvoiceHtml = (booking) => {
  const customer = getUser();
  const invoiceId = String(booking._id || '')
    .slice(-8)
    .toUpperCase();
  const hallName = booking.hallId?.hallName || 'Venue';
  const hotelName = booking.hotelId?.hotelName || 'Hotel';
  const hotelCity = booking.hotelId?.city || '';
  const hotelPhone = booking.hotelId?.contactPhone || '';
  const hotelAddress = booking.hotelId?.address || '';
  const dayRate = Number(booking.hallId?.pricePerDay) || 0;
  const deposit = Number(booking.depositAmount) || 0;
  const remaining = Math.max(dayRate - deposit, 0);
  const printedAt = new Date().toLocaleString('en-GB');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoiceId} — ${escapeHtml(hallName)}</title>
  <style>
    :root {
      --ink: #2a1d33;
      --muted: #6b6570;
      --brand: #4a2040;
      --gold: #c5a070;
      --line: #eadfe6;
      --ok: #0f6b35;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: "Segoe UI", Georgia, serif;
      color: var(--ink);
      background: #fff;
    }
    .sheet {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid var(--line);
      padding: 36px 40px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 3px solid var(--brand);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 28px;
      font-weight: 700;
      color: var(--brand);
      letter-spacing: 0.02em;
    }
    .brand span {
      display: block;
      margin-top: 4px;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
      font-family: "Segoe UI", sans-serif;
    }
    .meta {
      text-align: right;
      font-family: "Segoe UI", sans-serif;
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
    }
    .meta strong {
      display: block;
      color: var(--brand);
      font-size: 18px;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #dff7e8;
      color: var(--ok);
      font-size: 12px;
      font-weight: 700;
      font-family: "Segoe UI", sans-serif;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      font-family: "Segoe UI", sans-serif;
      font-size: 14px;
    }
    .box h3 {
      margin: 0 0 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--gold);
    }
    .box p {
      margin: 0;
      line-height: 1.55;
      color: var(--ink);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-family: "Segoe UI", sans-serif;
      font-size: 14px;
    }
    th, td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      text-align: left;
    }
    th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
    }
    td.amount, th.amount { text-align: right; }
    .totals {
      margin-left: auto;
      width: 280px;
      font-family: "Segoe UI", sans-serif;
      font-size: 14px;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
    }
    .totals .paid {
      color: var(--ok);
      font-weight: 700;
    }
    .totals .grand {
      border-bottom: none;
      font-size: 16px;
      font-weight: 700;
      color: var(--brand);
      padding-top: 12px;
    }
    .notes {
      margin-top: 28px;
      padding: 16px;
      background: #faf7f9;
      border-left: 4px solid var(--gold);
      font-family: "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.55;
    }
    .notes h3 {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--brand);
    }
    .notes p { margin: 0; white-space: pre-wrap; }
    .actions {
      margin: 24px auto 0;
      max-width: 720px;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      font-family: "Segoe UI", sans-serif;
    }
    .actions button {
      border: none;
      border-radius: 999px;
      padding: 10px 18px;
      font-weight: 700;
      cursor: pointer;
    }
    .actions .print {
      background: var(--brand);
      color: #fff;
    }
    .actions .close {
      background: #f1eef2;
      color: var(--brand);
    }
    .foot {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
      font-family: "Segoe UI", sans-serif;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .sheet { border: none; padding: 0; }
      .actions { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        Hargeisa Hall Finder
        <span>Venue booking deposit invoice</span>
      </div>
      <div class="meta">
        <strong>Invoice #${escapeHtml(invoiceId)}</strong>
        Issued: ${escapeHtml(formatDate(booking.updatedAt || booking.createdAt))}
        Printed: ${escapeHtml(printedAt)}
        <div class="badge">Booking Confirmed &amp; Deposit Verified</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <h3>Billed To</h3>
        <p>
          <strong>${escapeHtml(customer?.fullName || 'Customer')}</strong><br />
          ${escapeHtml(customer?.email || '')}<br />
          ${escapeHtml(customer?.phone || '')}
        </p>
      </div>
      <div class="box">
        <h3>Venue / Hotel</h3>
        <p>
          <strong>${escapeHtml(hallName)}</strong><br />
          ${escapeHtml(hotelName)}${hotelCity ? ` · ${escapeHtml(hotelCity)}` : ''}<br />
          ${hotelAddress ? `${escapeHtml(hotelAddress)}<br />` : ''}
          ${hotelPhone ? escapeHtml(hotelPhone) : ''}
        </p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Event Date</th>
          <th>Guests</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            Hall booking — ${escapeHtml(hallName)}
            ${dayRate ? `<br /><small style="color:#6b6570">Day rate ${money(dayRate)}</small>` : ''}
          </td>
          <td>${escapeHtml(formatDate(booking.eventDate))}</td>
          <td>${escapeHtml(booking.guestCount)}</td>
          <td class="amount">${dayRate ? money(dayRate) : money(deposit)}</td>
        </tr>
        <tr>
          <td colspan="3">Deposit received &amp; verified</td>
          <td class="amount">${money(deposit)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      ${dayRate ? `<div><span>Hall day rate</span><span>${money(dayRate)}</span></div>` : ''}
      <div class="paid"><span>Deposit paid</span><span>${money(deposit)}</span></div>
      ${dayRate ? `<div class="grand"><span>Balance due</span><span>${money(remaining)}</span></div>` : ''}
    </div>

    <div class="notes">
      <h3>Agreement notes</h3>
      <p>${escapeHtml(
        booking.agreementNotes?.trim() ||
          booking.specialNotes?.trim() ||
          'No special arrangements noted.'
      )}</p>
    </div>

    <div class="foot">
      Thank you for booking with Hargeisa Hall Finder. Keep this invoice as proof of deposit.
    </div>
  </div>
</body>
</html>`;
};

const getInvoiceFileName = (booking) => {
  const invoiceId = String(booking._id || '')
    .slice(-8)
    .toUpperCase();
  return `HHF-Invoice-${invoiceId || 'booking'}.html`;
};

/** Save invoice as an HTML file (no pop-up required). */
export const downloadBookingInvoice = (booking) => {
  const html = buildBookingInvoiceHtml(booking);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getInvoiceFileName(booking);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Print via a hidden iframe (avoids pop-up blockers). */
export const printBookingInvoice = (booking) => {
  const html = buildBookingInvoiceHtml(booking);

  const existing = document.getElementById('hhf-invoice-print-frame');
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'hhf-invoice-print-frame';
  iframe.title = 'Invoice print frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) {
      return;
    }
    printed = true;
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.remove();
        }
      }, 1500);
    }
  };

  // Some browsers fire load; others are ready immediately after write/close
  iframe.onload = triggerPrint;
  setTimeout(triggerPrint, 300);
};

/** Download the invoice file and open the system print dialog. */
export const downloadAndPrintBookingInvoice = (booking) => {
  downloadBookingInvoice(booking);
  printBookingInvoice(booking);
};
