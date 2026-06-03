import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ContactSection({
  office = "Sangli, Dattanagar, Sangli, Sangli, MAHARASHTRA, SANGLI, Pin 416416",
  phoneInfo = "+91 9822658094",
  emailInfo = "sunadvertise@gmail.com",
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (value.length < 3) {
          error = "Name must be at least 3 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Name can only contain letters and spaces";
        }
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!/^\d{10}$/.test(value)) {
          error = "Phone number must be exactly 10 digits";
        }
        break;
      case "message":
        if (value.length < 10) {
          error = "Message must be at least 10 characters";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation check
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(firestore, "contactMessages"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      setShowSuccess(true);
      setForm({ name: "", email: "", phone: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Error submitting message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClasses = (fieldName) => {
    const baseClasses = "w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 outline-none transition-all";
    const errorClasses = errors[fieldName]
      ? "border-2 border-red-500 focus:ring-red-500"
      : "border border-transparent focus:ring-yellow-400";
    return `${baseClasses} ${errorClasses}`;
  };

  return (
    <section
      id="contact"
      className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-screen bg-gray-900 text-white flex items-center py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Left side - Info */}
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-6 text-yellow-400">Get in Touch</h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            Need to advertise your brand or rent a billboard?
            We’re here to help you find the best spot for maximum visibility and impact.
          </p>

          <ul className="space-y-6">
            <li className="flex items-start space-x-4">
              <span className="text-2xl">📍</span>
              <div>
                <strong className="block text-yellow-400">Office</strong>
                <span className="text-gray-300">{office}</span>
              </div>
            </li>
            <li className="flex items-start space-x-4">
              <span className="text-2xl">📞</span>
              <div>
                <strong className="block text-yellow-400">Phone</strong>
                <span className="text-gray-300">{phoneInfo}</span>
              </div>
            </li>
            <li className="flex items-start space-x-4">
              <span className="text-2xl">✉️</span>
              <div>
                <strong className="block text-yellow-400">Email</strong>
                <span className="text-gray-300">{emailInfo}</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Right side - Form */}
        <div className="relative">
          {showSuccess && (
            <div className="absolute -top-16 left-0 right-0 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center justify-center animate-bounce">
              <span className="mr-2">✅</span>
              Message sent successfully! We will contact you soon.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700"
          >
            <h3 className="text-2xl font-semibold mb-8 text-center text-white">Send Us a Message</h3>

            <div className="space-y-5">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className={getInputClasses("name")}
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1 ml-1">{errors.name}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Your Phone Number (10 digits)"
                  className={getInputClasses("phone")}
                  value={form.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1 ml-1">{errors.phone}</p>}
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  className={getInputClasses("email")}
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>}
              </div>

              <div>
                <textarea
                  placeholder="Your Message"
                  rows="4"
                  name="message"
                  className={getInputClasses("message")}
                  value={form.message}
                  onChange={handleChange}
                ></textarea>
                {errors.message && <p className="text-red-500 text-sm mt-1 ml-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl transition duration-300 w-full shadow-lg hover:shadow-yellow-500/20 flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

