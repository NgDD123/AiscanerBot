// ✅ CONTACT PAGE FULLY UPDATED WITH EMAIL SENDING
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { toast } from "react-toastify";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay } },
});

const Contact = () => {
  // -------------------------
  // 🔥 FORM STATE + SEND MAIL
  // -------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    email: "",
    subject: "",
    body: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.email.trim() || !data.subject.trim() || !data.body.trim()) {
      toast.info("Please fill all fields!", { type: "warning" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NODE_ENV === "production"
          ? `https://freedombot.online/contacts/sendMail`
          : "http://localhost:8001/contacts/sendMail",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Message failed!");

      await response.json();
      toast.success("Message sent successfully!");
    } catch (error) {
      toast.error("Failed to send message!");
      return;
    } finally {
      setIsLoading(false);
      setData({ email: "", subject: "", body: "" });
    }
  };

  return (
    <div className="w-full bg-gray-900 text-white relative overflow-hidden">

      {/* Floating shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 20, -20, 0], rotate: [0, 45, -45, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute w-40 h-40 rounded-full bg-purple-600 opacity-20 blur-3xl top-20 left-10"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -30, 30, 0], rotate: [0, 90, -90, 0] }}
        transition={{ duration: 16, repeat: Infinity }}
        className="absolute w-60 h-60 rounded-full bg-pink-500 opacity-10 blur-2xl top-96 right-0"
      />

      {/* HERO SECTION */}
      <section className="relative w-full h-[50vh] flex flex-col justify-center items-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-extrabold text-purple-400 mb-4"
        >
          Contact Us
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-3xl text-gray-300 text-lg md:text-xl"
        >
          Have questions or need help? We're here for you.
        </motion.p>
      </section>

      {/* CONTACT INFO CARDS */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        {[
          { icon: <FaEnvelope />, title: "Email", text: "freedmobot@gmail.com" },
          { icon: <FaPhoneAlt />, title: "Phone", text: "+250 787703659" },
          { icon: <FaMapMarkerAlt />, title: "Address", text: "Kigali, Rwanda" },
        ].map((info, i) => (
          <motion.div
            key={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeIn(i * 0.2)}
            className="p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 text-center"
          >
            <div className="text-purple-400 text-4xl mb-4 flex justify-center">
              {info.icon}
            </div>
            <h3 className="text-2xl font-bold text-purple-300 mb-2">
              {info.title}
            </h3>
            <p className="text-gray-300">{info.text}</p>
          </motion.div>
        ))}
      </section>

      {/* GOOGLE MAP */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-3xl md:text-4xl font-bold text-purple-300 mb-8 text-center"
        >
          Our Location
        </motion.h2>

        <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-700">
          <iframe
            title="Kigali Map"
            className="w-full h-full"
            src="https://www.google.com/maps/embed?pb=!1m18..."
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </section>

      {/* CONTACT FORM WITH NODEMAILER */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeIn()}
          className="text-4xl font-bold text-purple-300 mb-12 text-center"
        >
          Send Us a Message
        </motion.h2>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6"
        >
          <input
            type="email"
            placeholder="Your Email"
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />

          <input
            type="text"
            placeholder="Subject"
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700"
            value={data.subject}
            onChange={(e) => setData({ ...data, subject: e.target.value })}
          />

          <textarea
            placeholder="Write your message..."
            rows="6"
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700"
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.target.value })}
          />

          <button
            type="submit"
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition"
          >
            {isLoading ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </section>

      {/* SOCIALS */}
      <section className="py-12 px-6 text-center">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-purple-300 mb-6"
        >
          Connect With Us
        </motion.h3>

        <div className="flex justify-center gap-6">
          <FaFacebookF className="text-gray-300 hover:text-purple-400 text-2xl cursor-pointer" />
          <FaTwitter className="text-gray-300 hover:text-purple-400 text-2xl cursor-pointer" />
          <FaLinkedinIn className="text-gray-300 hover:text-purple-400 text-2xl cursor-pointer" />
        </div>
      </section>
    </div>
  );
};

export default Contact;
