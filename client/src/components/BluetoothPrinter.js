// BluetoothPrinter.js
import React, { useEffect } from 'react';

const BluetoothPrinter = ({ order }) => {
  useEffect(() => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const printOrder = async () => {
      if (!navigator.bluetooth) {
        alert('Bluetooth not supported on this device/browser.');
        return;
      }

      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            '0000ffe0-0000-1000-8000-00805f9b34fb',
            '0000ffe5-0000-1000-8000-00805f9b34fb',
            '00001800-0000-1000-8000-00805f9b34fb',
            '00001801-0000-1000-8000-00805f9b34fb',
            'device_information',
            'generic_access',
          ],
        });

        console.log('Selected device:', device.name);

        const server = await device.gatt.connect();
        console.log('Connected to GATT server');

        const services = await server.getPrimaryServices();
        console.log(`Found ${services.length} services.`);

        // Encode your print content once
        const printContent = buildReceiptText(order);
        const encoder = new TextEncoder();
        const data = encoder.encode(printContent);
        const chunkSize = 20;

        // Track if anything was written successfully
        let wroteSomething = false;

        // Loop all services and characteristics
        for (const service of services) {
          console.log('Service:', service.uuid);

          const characteristics = await service.getCharacteristics();
          for (const characteristic of characteristics) {
            console.log(' ↳ Characteristic:', characteristic.uuid, 'properties:', characteristic.properties);

            // If writable, try writing
            if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
              try {
                console.log('Trying to write to characteristic:', characteristic.uuid);

                // Write in 20-byte chunks
                for (let i = 0; i < data.length; i += chunkSize) {
                  const chunk = data.slice(i, i + chunkSize);
                  await characteristic.writeValue(chunk);
                  await sleep(100); // small delay between writes
                }

                console.log('Write succeeded on', characteristic.uuid);
                wroteSomething = true;
                // Optionally, break if you want to stop after first success
                break;
              } catch (writeErr) {
                console.warn('Write failed on', characteristic.uuid, writeErr);
              }
            }
          }
          if (wroteSomething) break; // stop after first success
        }

        if (wroteSomething) {
          alert('Printed successfully!');
        } else {
          alert('No writable characteristic accepted data for printing.');
        }
      } catch (err) {
        if (err.name === 'NotFoundError') {
          console.warn('Device chooser was closed without selection.');
        } else {
          console.error('Bluetooth print failed:', err);
          alert('Failed to print: ' + err.message);
        }
      }
    };

    if (order) {
      printOrder();
    }
  }, [order]);

  const buildReceiptText = (order) => {
    const lines = [];

    lines.push('=== ORDER RECEIPT ===');
    lines.push(`Order ID: ${order.orderId}`);
    lines.push(`Date: ${new Date(order.orderDate).toLocaleString()}`);
    lines.push('-------------------------');

    order.items.forEach((item) => {
      const qty = parseInt(item.quantity);
      const price = parseFloat(item.price);
      lines.push(`${item.name}`);
      lines.push(`${qty} × ₹${price.toFixed(2)} = ₹${(qty * price).toFixed(2)}`);
    });

    lines.push('-------------------------');
    lines.push(`TOTAL: ₹${Number(order.total).toFixed(2)}`);
    lines.push(`Payment: ${order.paymentMethod}`);
    lines.push(`Type: ${Number(order.total) < 200 ? 'Takeaway' : 'Delivery'}`);

    if (order.address) {
      lines.push('--- Delivery Address ---');
      lines.push(`${order.address.name}`);
      lines.push(`${order.address.street}`);
      lines.push(`${order.address.city} – ${order.address.zip}`);
      lines.push(`Phone: ${order.address.phone}`);
    }

    lines.push('\n\n\n'); // Padding for cut
    return lines.join('\n');
  };

  return null;
};

export default BluetoothPrinter;
