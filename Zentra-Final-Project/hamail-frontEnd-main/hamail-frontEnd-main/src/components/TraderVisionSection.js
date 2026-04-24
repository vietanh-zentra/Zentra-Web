// "use client";
// import { motion } from "framer-motion";
// import Container from "./Container";

// // Removed the ": Variants" type to fix the parsing error
// const blockVariants = {
//   offscreenBottom: {
//     opacity: 0,
//     y: 50,
//   },
//   onscreen: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       type: "spring",
//       bounce: 0.3,
//       duration: 0.8,
//     },
//   },
// };

// export const getGradientTextStyle = (deg = 312) => ({
//   background: `linear-gradient(${deg}deg, #F0E8D0 0%, #00BFA6 50%, #000080 100%)`,
//   backgroundClip: "text",
//   WebkitBackgroundClip: "text",
//   WebkitTextFillColor: "transparent",
//   color: "transparent",
// });

// const TEXT_BLOCKS = [
//   [
//     "Your biggest risk isn’t the setup. It’s the",
//     "state you’re in when you take it.",
//   ],
//   ["Zentra detects your psychological state",
//   "in real time."],
//   ["Designed to keep your trading decisions " ,

//     "clear and consistent."
//   ],
//     ["Journals explain mistakes"],

//       ["Zentra prevents them"],

// ];

// export default function TraderVisionSection() {
//   const gradientStyle = getGradientTextStyle(325);

//   return (
//     <section
//       id="vision"
//       className="relative py-14 md:py-22 lg:py-[100px] sm:px-[120px]  px-5  overflow-hidden bg-white scroll-mt-12"
//     >
//       <Container
//         maxWidth="5xl"
//         className=" relative z-10"
//         padding={false}
//       >
//         <div className="text-center flex flex-col items-center space-y-5 sm:space-y-10">
//           {TEXT_BLOCKS.map((lines, index) => (
//             <motion.div
//               key={index}
//               initial="offscreenBottom"
//               whileInView="onscreen"
//               viewport={{ once: false, amount: 0.8 }}
//               variants={blockVariants}
//               className="w-full"
//             >
//               <h2
//                 style={gradientStyle}
//                 className="text-[20px] md:text-[32px] lg:text-[48px] font-bold leading-tight"
//               >
//                 {lines[0]}
//                 <br />
//                 {lines[1]}
//               </h2>
//             </motion.div>
//           ))}
//         </div>
//       </Container>

//     </section>
//   );
// }

"use client";
import { motion } from "framer-motion";
import Container from "./Container";

const blockVariants = {
  offscreenBottom: {
    opacity: 0,
    y: 50,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8,
    },
  },
};

export const getGradientTextStyle = (deg = 312) => ({
  background: `linear-gradient(${deg}deg, #F0E8D0 0%, #00BFA6 50%, #000080 100%)`,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
});

const TEXT_BLOCKS = [
  ["Your biggest risk isn’t the setup. It’s the", "state you’re in when you take it."],
  ["Zentra detects your psychological state", "in real time."],
  ["Designed to keep your trading decisions ", "clear and consistent."],
  ["Journals explain mistakes"],
  ["Zentra prevents them"],
];

export default function TraderVisionSection() {
  const gradientStyle = getGradientTextStyle(325);

  return (
    <section
      id="vision"
      className="relative py-14 md:py-22 lg:py-[100px] sm:px-[120px] px-5 overflow-hidden bg-white scroll-mt-12"
    >
      <Container maxWidth="5xl" className=" relative z-10" padding={false}>
        <div className="text-center flex flex-col items-center space-y-5 sm:space-y-10">
          {TEXT_BLOCKS.map((lines, index) => (
            <motion.div
              key={index}
              initial="offscreenBottom"
              whileInView="onscreen"
              // margin: "100% 0px 0px 0px" extends the trigger zone far above the screen
              // amount: 0.5 triggers when half the text is visible from the bottom
              viewport={{ 
                once: false, 
                amount: 0.5, 
                margin: "100% 0px -10% 0px" 
              }}
              variants={blockVariants}
              className="w-full"
            >
              <h2
                style={gradientStyle}
                className="text-[20px] md:text-[32px] lg:text-[48px] font-semibold sm:leading-[64px] leading-[32px] "
              >
                {lines[0]}
                {/* Fixed the <br/> issue for single-line blocks */}
                {lines[1] && <><br />{lines[1]}</>}
              </h2>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}