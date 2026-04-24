"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { getAryanAgeText } from "@/utils/ageCalculator";

export default function AboutPage() {
  return (
    <div className="bg-white text-black">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black font-figtree mb-6">
              About The Speech Heroes
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-8"></div>
            <p className="text-lead text-gray-600 max-w-3xl mx-auto">
              A family's journey from challenge to hope, creating a world where
              every child's voice matter
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Family Story */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-black font-figtree mb-8">
                Our Story
              </h2>

              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>
                  We're the Kaushal family — Rishi, Priya, and Aryan — a family
                  on a mission to raise awareness about Speech and Language
                  delays in children.
                </p>

                <p>
                  Our journey began when Aryan, now {getAryanAgeText()}, was
                  diagnosed with a Speech and Language delay in particular
                  Developmental Language Delay. Like many families, we faced the
                  worry and uncertainty of navigating a world not always built
                  to understand children who communicate differently.
                </p>

                <p>
                  With limited support available rather than feeling alone, we
                  chose to turn our experience into something creative and
                  hopeful. Last year with Rishi's imagination, Priya's steady
                  support, and Aryan's determination,{" "}
                  <strong>The Speech Heroes were born!</strong>
                </p>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border-l-4 border-primary my-8">
                  <p className="text-emphasis text-black italic">
                    "A world of story, song, and Superheroes built on empathy
                    and expression."
                  </p>
                </div>

                <p>
                  Priya has been a constant source of encouragement behind the
                  scenes, and care to every step of the journey. Rishi, a
                  creative advocate and runner who has long raised awareness on
                  issues like Domestic Abuse and Homelessness, now uses his
                  energy to spotlight the importance of communication for all
                  children.
                </p>

                <p>
                  Our hope is that The Speech Heroes brings comfort to families
                  like ours and reminds every child that their voice, in
                  whatever form, is powerful.
                </p>
              </div>
            </motion.div>

            {/* Family Image Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/Family Pic.jpg"
                  alt="The Kaushal Family - Rishi, Priya, and Aryan"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                {/* Overlay with family names */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-6">
                  <div className="relative">
                    {/* Branded accent line */}
                    <div className="absolute -top-2 left-0 w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"></div>

                    <div className="text-white space-y-2">
                      <h3 className="text-2xl md:text-3xl font-bold font-figtree tracking-wide text-white">
                        The Kaushal Family
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-fourth rounded-full"></div>
                        <p className="text-base font-medium text-primary/90 tracking-wide">
                          Rishi, Priya, and Aryan
                        </p>
                        <div className="w-2 h-2 bg-fourth rounded-full"></div>
                      </div>
                    </div>

                    {/* Subtle brand pattern overlay */}
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating decorative elements */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-4 -right-4 w-8 h-8 bg-fourth rounded-full opacity-60"
              />
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary rounded-full opacity-60"
              />
            </motion.div>

            {/* Mission Statement */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-black font-figtree mb-8 mt-16">
                Our Mission
              </h2>

              <div className="bg-gradient-to-br from-fourth/10 to-fifth/10 rounded-2xl p-8">
                <p className="text-lead text-gray-700 mb-6">
                  The Speech Heroes is a world where imagination meets real-life
                  challenges. Inspired by our own journey as a family, we
                  created songs, stories and characters that give children with
                  Speech and Language delays a voice, and show them they are
                  stronger than they think.
                </p>

                <p className="text-lead text-gray-600">
                  Here, every adventure is about courage, connection, and
                  finding ways to be heard. Whether you are a parent, teacher,
                  Speech and Language therapist, professional, or young reader,
                  you are part of this superhero team.
                </p>
              </div>
            </motion.div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-black font-figtree mb-8">
                Our Values
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-primary/20">
                  <div className="text-4xl mb-4">💪</div>
                  <h3 className="text-xl font-bold text-black mb-3">
                    Strength
                  </h3>
                  <p className="text-gray-600">
                    Every child has inner strength waiting to be unlocked,
                    regardless of how they communicate.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary/20">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-bold text-black mb-3">Support</h3>
                  <p className="text-gray-600">
                    Families need understanding, resources, and a community that
                    celebrates all voices.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border border-third/20">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-xl font-bold text-black mb-3">
                    Creativity
                  </h3>
                  <p className="text-gray-600">
                    Imagination and creative expression are powerful tools for
                    communication and growth.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-black mb-4">
                  Join Our Mission
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Whether you're a parent, educator, or supporter, you can help
                  us spread awareness and create a more inclusive world for all
                  children.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-full hover:from-secondary hover:to-third transition-all duration-300 transform hover:scale-105"
                  >
                    Get in Touch
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </a>
                  <a
                    href="/book"
                    className="inline-flex items-center px-6 py-3 bg-white text-primary font-medium rounded-full border-2 border-primary hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105"
                  >
                    Get the Book
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
