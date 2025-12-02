import React, { useState } from 'react';
import "./on-board.css";
import { toast } from 'react-toastify';

const ContactSection = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState({
        email: "",
        subject: "",
        body: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!data.email.trim() || !data.subject.trim() || !data.body.trim()) {
            toast.info("Please fill all the required fields!", { type: 'warning' });
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(
                process.env.NODE_ENV === "production"
                    ? `https://freedombot.online/contacts/sendMail`
                    : 'http://localhost:8001/contacts/sendMail',
                {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "application/json"
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to send the message!");
            }

            await response.json();
            toast.success("Message sent successfully!", { type: 'success' });
        } catch (error) {
            toast.error("Failed to send the message!", { type: 'error' });
            return;
        } finally {
            setIsLoading(false);
            setData({
                email: "",
                subject: "",
                body: ""
            });
        }
    };

    return (
        <div className="relative overflow-hidden p-4 my-12 w-[90%] md:w-[40%] mx-auto rounded-xl">
            
            {/* Same gradient + glow background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f29] via-[#0c002b] to-[#2b0048]"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#7900ff] opacity-30 blur-[180px] rounded-full"></div>

            {/* Contact content */}
            <div className="relative z-10">
                <h5
                    id="contact-label"
                    className="flex items-center justify-center mb-6 text-base font-semibold text-white"
                >
                    <svg
                        className="w-4 h-4 mr-2.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 16"
                    >
                        <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                        <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                    </svg>
                    Contact us
                </h5>

                <form>
                    <div className="mb-2">
                        <p className="text-white text-sm">Your email</p>
                        <input
                            type="email"
                            id="email"
                            className="w-full my-2 text-white border border-white p-2.5 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm"
                            placeholder="name@company.com"
                            required
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                        />
                    </div>

                    <div className="mb-2">
                        <p className="text-white text-sm">Subject</p>
                        <input
                            type="text"
                            id="subject"
                            className="w-full my-2 text-white border border-white p-2.5 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm"
                            placeholder="Let us know how we can help you"
                            required
                            value={data.subject}
                            onChange={(e) => setData({ ...data, subject: e.target.value })}
                        />
                    </div>

                    <div className="mb-2">
                        <p className="text-white text-sm">Your message</p>
                        <textarea
                            id="message"
                            rows="4"
                            className="w-full my-2 text-white border border-white p-2.5 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm"
                            placeholder="Your message..."
                            value={data.body}
                            onChange={(e) => setData({ ...data, body: e.target.value })}
                        />
                    </div>

                    <div className='w-full flex justify-center mb-3'>
                        <button
                            onClick={handleSubmit}
                            className="text-[#ca217ebb] border rounded-2xl bg-white md:w-1/3 mx-auto p-2 text-sm font-bold hover:cursor-pointer 
                                       hover:bg-[#ca217ebb] hover:text-white hover:border-none transition duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading ...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default ContactSection;
