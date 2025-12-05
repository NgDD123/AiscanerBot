import React from "react";
import { motion, useViewportScroll, useTransform } from "framer-motion";

// Animation helpers
const fadeInScale = (delay = 0) => ({
  hidden: { opacity: 0, y: 40, scale: 0.95, rotate: -1 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 1, delay }
  }
});

// Team data
const team = [
  { name: "David Ngiriyeza", role: "Founder & CEO", image: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Alice Uwase", role: "Lead Developer", image: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "John Bizimana", role: "Trading Strategist", image: "https://randomuser.me/api/portraits/men/55.jpg" },
];

// Floating Particle component
const Particle = ({ size = 10, color = "purple", x = 0, y = 0, delay = 0 }) => {
  const colors = { purple: "#9f7aea", pink: "#f687b3", blue: "#63b3ed" };
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ y: [y, y - 30, y], x: [x, x + 20, x] }}
      transition={{ duration: 8, repeat: Infinity, delay }}
      className={`absolute rounded-full`}
      style={{ width: size, height: size, backgroundColor: colors[color] || "#9f7aea", opacity: 0.3 }}
    />
  );
};

const About = () => {
  const { scrollY } = useViewportScroll();
  const yHero = useTransform(scrollY, [0, 800], [0, 150]);
  const yShape1 = useTransform(scrollY, [0, 800], [0, 100]);
  const yShape2 = useTransform(scrollY, [0, 800], [0, -100]);
  const bgGradient = useTransform(scrollY, [0, 2000], ["#1a202c", "#0b0b0e"]);

  return (
    <motion.div style={{ background: bgGradient }} className="w-full relative overflow-hidden text-white">

      {/* HERO VIDEO */}
      <section className="relative w-full h-[80vh] overflow-hidden">
        <motion.video
          style={{ y: yHero }}
          autoPlay
          loop
          muted
          className="absolute w-full h-full object-cover brightness-50"
          src="https://cdn.pixabay.com/vimeo/474631014/finance-background-10469.mp4?width=1280&hash=d85deccff7599eb13aa6b7da07e988f7"
        />
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-7xl font-extrabold text-purple-400 mb-6 tracking-wide"
          >
            <span className="text-white">Empowering</span> Traders <span className="text-pink-500">Worldwide</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg md:text-2xl max-w-3xl text-gray-300"
          >
            Combining education, automation, and AI-driven tools to create <span className="text-purple-400 font-bold">financial freedom</span> for young traders.
          </motion.p>
        </div>

        {/* Floating Neon Shapes */}
        <motion.div
          style={{ y: yShape1 }}
          animate={{ x: [0, 80, 0], rotate: [0, 360, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-24 h-24 rounded-full bg-purple-500 blur-3xl opacity-40"
        />
        <motion.div
          style={{ y: yShape2 }}
          animate={{ x: [0, -100, 0], rotate: [0, -360, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-pink-500 blur-3xl opacity-30"
        />

        {/* Floating Particles */}
        <Particle size={8} color="purple" x={50} y={300} delay={0} />
        <Particle size={6} color="pink" x={200} y={500} delay={2} />
        <Particle size={12} color="blue" x={400} y={600} delay={1} />
        <Particle size={10} color="purple" x={600} y={400} delay={3} />
        <Particle size={5} color="pink" x={800} y={350} delay={0.5} />
      </section>

      {/* STORY SECTION */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeInScale(0)}
          className="text-4xl font-bold text-purple-300 mb-12 text-center tracking-wide"
        >
          Our Story
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeInScale(0.2)}
          className="space-y-6 text-lg text-gray-300 leading-relaxed"
        >
          <p>
            From a small vision to a global mission, we started with a desire to understand financial markets and empower young traders everywhere.
          </p>
          <p>
            Years of studying charts, psychology, and automation led to building advanced trading bots and educational platforms.
          </p>
          <p>
            Today, we are a team of passionate educators, developers, and strategists dedicated to giving traders the tools and knowledge they need to succeed.
          </p>
        </motion.div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-20 bg-gray-800 px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12"
        >
          <motion.div
            variants={fadeInScale(0)}
            className="p-8 bg-gray-900 rounded-2xl shadow-lg border border-gray-700"
          >
            <h3 className="text-3xl font-bold text-purple-400 mb-4 tracking-wide">Our Mission</h3>
            <p className="text-gray-300 text-lg">
              To educate, automate, and empower traders globally, providing tools and strategies that maximize profits while minimizing risk.
            </p>
          </motion.div>
          <motion.div
            variants={fadeInScale(0.2)}
            className="p-8 bg-gray-900 rounded-2xl shadow-lg border border-gray-700"
          >
            <h3 className="text-3xl font-bold text-purple-400 mb-4 tracking-wide">Our Vision</h3>
            <p className="text-gray-300 text-lg">
              To become the world’s most trusted platform for trading education and AI-powered automation, shaping the future of trading for the next generation.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeInScale(0)}
          className="text-4xl font-bold text-purple-300 mb-14 text-center tracking-wide"
        >
          Meet the Team
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-10">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.3 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 text-center"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 mx-auto rounded-full mb-4 border-4 border-purple-500"
              />
              <h3 className="text-xl font-bold text-purple-400">{member.name}</h3>
              <p className="text-gray-300">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-20 bg-black px-6 text-center">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeInScale(0)}
          className="text-4xl font-bold text-purple-300 mb-14 tracking-wide"
        >
          Our Impact
        </motion.h2>

        <div className="grid md:grid-cols-4 gap-10 max-w-6xl mx-auto">
          {[
            { number: 10000, label: "Students Taught" },
            { number: 35, label: "Countries Reached" },
            { number: 200, label: "Trading Strategies" },
            { number: 50, label: "Automation Bots" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.3 }}
            >
              <AnimatedCounter value={stat.number} />
              <p className="text-gray-300 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-28 text-center bg-gray-900 px-6">
        <motion.h2
          initial="hidden"
          whileInView="show"
          variants={fadeInScale(0)}
          className="text-4xl font-bold text-purple-300 mb-4 tracking-wide"
        >
          Ready to Transform Your Future?
        </motion.h2>

        <motion.p
          initial="hidden"
          whileInView="show"
          variants={fadeInScale(0.3)}
          className="text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Join thousands of students who have built skills, confidence, and freedom through our trading education and automation tools.
        </motion.p>

        <motion.a
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          href="/signup"
          className="px-12 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition"
        >
          Start Learning Today
        </motion.a>
      </section>
    </motion.div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ value }) => {
  const motionProps = {
    initial: { count: 0 },
    animate: { count: value },
    transition: { duration: 2, ease: "easeOut" },
  };

  return (
    <motion.h3
      {...motionProps}
      className="text-5xl font-extrabold text-purple-400"
    >
      {Math.floor(value)}
    </motion.h3>
  );
};

export default About;
