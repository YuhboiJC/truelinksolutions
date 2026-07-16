import { motion } from 'framer-motion';

const ServiceCard = ({ icon: Icon, title, description, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
  >
    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-5">
      <Icon className="w-6 h-6 text-orange-500" />
    </div>
    <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

export default ServiceCard;
