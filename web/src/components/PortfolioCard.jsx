import { motion } from 'framer-motion';

const PortfolioCard = ({ title, description, metrics, image, imageAlt, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
  >
    <div className="h-48 overflow-hidden bg-slate-100">
      <img
        src={image}
        alt={imageAlt || title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="p-6">
      <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">{description}</p>
      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{metrics}</p>
    </div>
  </motion.div>
);

export default PortfolioCard;
