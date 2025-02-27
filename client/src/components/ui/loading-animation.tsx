import { motion } from "framer-motion";

const bounceTransition = {
  y: {
    duration: 0.4,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeOut"
  },
  backgroundColor: {
    duration: 0.2,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeOut",
    repeatDelay: 0.2,
  },
};

export function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            transition={{
              ...bounceTransition,
              delay: i * 0.1
            }}
            animate={{
              y: ["0%", "-50%"],
              backgroundColor: ["hsl(var(--primary))", "hsl(var(--primary) / 0.5)"]
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <motion.div
      className="bg-card rounded-lg p-4 h-[300px] flex items-center justify-center"
      initial={{ opacity: 0.5 }}
      animate={{ 
        opacity: [0.5, 0.8, 0.5],
        scale: [0.98, 1, 0.98]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <LoadingAnimation />
    </motion.div>
  );
}

export function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="bg-card rounded-lg p-4 h-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            y: 0
          }}
          transition={{
            duration: 1,
            delay: i * 0.1,
            opacity: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      ))}
    </div>
  );
}
