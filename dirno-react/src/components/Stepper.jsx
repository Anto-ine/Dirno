import { motion } from 'framer-motion';

const steps = [
  { id: 1, label: 'Bases de données' },
  { id: 2, label: 'Convoi & itinéraire' },
  { id: 3, label: 'Résultats' },
];

export default function Stepper({ current }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="stepper-item">
            <div className="stepper-left">
              <motion.div
                className={`stepper-circle${active ? ' active' : ''}${done ? ' done' : ''}`}
                initial={false}
                animate={{
                  scale: active ? 1.1 : 1,
                  backgroundColor: done ? '#22c55e' : active ? '#f97316' : '#e5e5e5',
                }}
                transition={{ duration: 0.25 }}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ color: active ? 'white' : '#a3a3a3', fontSize: '0.65rem', fontWeight: 700 }}>
                    {step.id}
                  </span>
                )}
              </motion.div>
              {i < steps.length - 1 && (
                <motion.div
                  className="stepper-line"
                  initial={false}
                  animate={{ backgroundColor: done ? '#22c55e' : '#e5e5e5' }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </div>
            <motion.span
              className="stepper-label"
              initial={false}
              animate={{ color: active ? '#f97316' : done ? '#0f0f0f' : '#a3a3a3', fontWeight: active ? 600 : 400 }}
              transition={{ duration: 0.2 }}
            >
              {step.label}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
