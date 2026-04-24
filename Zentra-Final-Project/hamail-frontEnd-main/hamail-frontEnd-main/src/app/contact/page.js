"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import SectionHero from "../../components/SectionHero";
import { EMAIL_ADDRESS, INSTAGRAM_PROFILE } from "../../constants";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create mailto link with prepopulated information
    const subject = encodeURIComponent("Contact Form - The Speech Heroes");
    const body = encodeURIComponent(
      `Name: ${formData.name}\n\nMessage:\n${formData.message}`
    );
    const mailtoLink = `mailto:${EMAIL_ADDRESS}?subject=${subject}&body=${body}`;

    // Open default mail provider
    window.open(mailtoLink, "_blank");

    // Show success message
    setSubmitStatus("success");
    setFormData({ name: "", message: "" });
  };

  return (
    <>
      <SectionHero title="Contact The Speech Heroes" />

      {/* Main Contact Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-third/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-figtree text-black mb-6">
                  Send a Message
                </h3>

                {submitStatus === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 text-2xl">✓</span>
                    </div>
                    <h4 className="text-large font-figtree text-black mb-2">
                      Email Ready to Send!
                    </h4>
                    <p className="text-secondary">
                      Your email app should have opened with your message ready
                      to send. Just click send when you're ready!
                    </p>
                    <button
                      onClick={() => setSubmitStatus(null)}
                      className="mt-6 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-black font-medium mb-2"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-black font-medium mb-2"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                        placeholder="Tell us about your interest in The Speech Heroes or ask any questions..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-white py-4 px-8 rounded-full font-medium text-lg hover:bg-primary/80 transition-colors flex items-center justify-center"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-figtree text-black mb-6">
                  Join the Speech Heroes Journey
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mb-8"></div>
                <p className="text-lead text-gray-600 mb-6">
                  Whether you're interested in booking a school visit, have
                  questions about our book, or want to learn more about
                  supporting children with Speech and Language delays, we'd love
                  to hear from you.
                </p>
                <p className="text-lead text-gray-600">
                  Fill in your details and message, and we'll respond as soon as
                  possible.
                </p>
              </div>

              {/* Contact Details */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-xl font-figtree text-black mb-6">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xl">📧</span>
                    </div>
                    <div>
                      <p className="text-black font-medium">Email</p>
                      <a
                        href={`mailto:${EMAIL_ADDRESS}`}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        {EMAIL_ADDRESS}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-third/20 rounded-full flex items-center justify-center">
                      <span className="text-third text-xl">📱</span>
                    </div>
                    <div>
                      <p className="text-black font-medium">Instagram</p>
                      <a
                        href={INSTAGRAM_PROFILE}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        @_thespeechheroes
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* What We Offer */}
              <div className="bg-gradient-to-br from-third/10 to-primary/10 p-8 rounded-2xl border border-third/20">
                <h3 className="text-xl font-figtree text-black mb-4">
                  What We Offer
                </h3>
                <p className="text-gray-600 mb-4">
                  We provide school visits, workshops, and resources to support
                  children with Speech and Language delays.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                    <span className="text-black font-medium text-small">
                      School Visits
                    </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                    <span className="text-black font-medium text-small">
                      Workshops
                    </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                    <span className="text-black font-medium text-small">
                      Children's Book
                    </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                    <span className="text-black font-medium text-small">
                      Music & Resources
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Information Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-figtree text-black mb-6">
              What to Expect
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mx-auto mb-8"></div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📞",
                title: "Quick Response",
                description:
                  "We aim to respond to all messages within 24 hours during business days.",
              },
              {
                icon: "🏫",
                title: "School Visits",
                description:
                  "Interactive workshops and storytelling sessions for schools and groups.",
              },
              {
                icon: "📚",
                title: "Educational Resources",
                description:
                  "Books, music, and materials to support children with Speech and Language delays.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-third/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-figtree text-black mb-3">
                  {item.title}
                </h3>
                <p className="text-secondary leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
