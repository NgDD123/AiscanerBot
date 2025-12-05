import React from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay } },
});

const Contact = () => {
  return (
    <div className="w-full bg-gray-900 text-white relative overflow-hidden">

      {/* Floating shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 20, -20, 0], rotate: [0, 45, -45, 0] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-40 h-40 rounded-full bg-purple-600 opacity-20 blur-3xl top-20 left-10 z-0"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -30, 30, 0], rotate: [0, 90, -90, 0] }}
        transition={{ duration: 16, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-60 h-60 rounded-full bg-pink-500 opacity-10 blur-2xl top-96 right-0 z-0"
      />

      {/* HERO SECTION */}
      <section className="relative w-full h-[50vh] flex flex-col justify-center items-center text-center bg-gradient-to-b from-gray-900 via-gray-800 to-black px-6 z-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-extrabold text-purple-400 mb-4 tracking-wide"
        >
          Contact Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-3xl text-gray-300 text-lg md:text-xl"
        >
          Have questions or need assistance? Reach out to our team and we’ll guide you every step of the way.
        </motion.p>
      </section>

      {/* CONTACT INFO SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-10 relative z-10">
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
            <h3 className="text-2xl font-bold text-purple-300 mb-2">{info.title}</h3>
            <p className="text-gray-300">{info.text}</p>
          </motion.div>
        ))}
      </section>

      {/* GOOGLE MAP SECTION */}
      <section className="py-12 px-6 max-w-6xl mx-auto relative z-10">
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
            title="Kigali Office"
            className="w-full h-full"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.024955086864!2d30.05848727533005!3d-1.9440687360288856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca6f91452e9e9%3A0xa888f847e2ebf!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
        <p className="mt-4 text-center text-gray-400">
          Click on the map to open in Google Maps.
        </p>
      </section>

      {/* CONTACT FORM SECTION */}
      <section className="py-20 px-6 max-w-4xl mx-auto relative z-10">
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
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6"
        >
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Subject"
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Your Message"
            rows={6}
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition"
          >
            Send Message
          </button>
        </motion.form>
      </section>

      {/* SOCIAL MEDIA LINKS */}
      <section className="py-12 px-6 text-center relative z-10">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-bold text-purple-300 mb-6"
        >
          Connect with us on Social Media
        </motion.h3>

        <div className="flex justify-center gap-6">
          <a href="#" className="text-gray-300 hover:text-purple-400 text-2xl transition">
            <FaFacebookF />
          </a>
          <a href="#" className="text-gray-300 hover:text-purple-400 text-2xl transition">
            <FaTwitter />
          </a>
          <a href="#" className="text-gray-300 hover:text-purple-400 text-2xl transition">
            <FaLinkedinIn />
          </a>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-20 px-6 text-center bg-gray-900 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-purple-300 mb-4"
        >
          Ready to Get in Touch?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Our team is ready to assist you with all inquiries. Whether you want to join our courses or learn more about our services, we are here to help.
        </motion.p>
        <motion.a
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          href="/signup"
          className="px-12 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition"
        >
          Join Us Today
        </motion.a>
      </section>
    </div>
  );
};

export default Contact;
