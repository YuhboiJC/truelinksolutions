import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TestimonialCard = ({ quote, name, business, initials, bgColor, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm"
  >
    <Quote className="w-8 h-8 text-orange-200 mb-4" />
    <p className="text-navy-900 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-full ${bgColor} text-white flex items-center justify-center font-semibold text-sm`}>
        {initials}
      </div>
      <div>
        <p className="font-semibold text-navy-900 text-sm">{name}</p>
        <p className="text-slate-500 text-sm">{business}</p>
      </div>
    </div>
  </motion.div>
);

export default TestimonialCard;
