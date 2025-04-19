const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
    console.log("Scan this QR code in WhatsApp to log in:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("WhatsApp client is ready!");
});

client.initialize();

const sendWhatsAppOTP = async (phoneNumber, otp) => {
    try {
        const message = `Your OTP is: ${otp}. It will expire in 5 minutes.`;
        await client.sendMessage(phoneNumber + "@c.us", message);
        return { success: true, message: "OTP sent successfully" };
    } catch (error) {
        throw new Error("Failed to send OTP via WhatsApp");
    }
};

module.exports = { sendWhatsAppOTP };
