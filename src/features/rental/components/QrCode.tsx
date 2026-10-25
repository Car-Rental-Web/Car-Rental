
const QR_DATA = [
  { 
    label: "Step 1: Fill out the form", 
    title: "Google Form", 
    src: "/googleform.jpg", 
    color: "bg-blue-600"
  },
  { 
    label: "Step 2: Find our spot", 
    title: "Location", 
    src: "/location.jpg", 
    color: "bg-red-600"
  },
  { 
    label: "Step 3: Pay via GCash", 
    title: "GCash", 
    src: "/gcash.jpg", 
    color: "bg-blue-500"
  },
  { 
    label: "Step 4: Pay via BPI", 
    title: "BPI", 
    src: "/bpi.jpg", 
    color: "bg-red-800"
  },
];

const QrCode = () => {

  return (
    <section className="w-full py-16 bg-slate-50 min-h-screen flex flex-col items-center justify-center">
      {/* Header Section */}
      <div className="text-center mb-16 px-4">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">
          Registration & Payment
        </h2>
        <p className="text-lg text-slate-500 font-medium">
          Please scan the QR codes below to complete your booking process.
        </p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-6 max-w-5xl w-full">
        {QR_DATA.map((item, index) => (
          <div key={index} className="flex flex-col items-center group">
            {/* Label with Step Number */}
            <div className="mb-4 flex items-center gap-2">
               <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-black rounded-full uppercase">
                 {item.label}
               </span>
            </div>

            {/* BIG QR CARD */}
            <div className="bg-white p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] hover:-translate-y-2 w-full max-w-[500px]">
              
              {/* Title Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-3 h-3 rounded-full ${item.color.replace('bg-', 'bg-')}`} />
                <h3 className="font-black text-3xl text-slate-800 tracking-tight uppercase">
                  {item.title}
                </h3>
              </div>

              {/* JUMBO QR IMAGE CONTAINER */}
              <div className="relative w-64 h-64 md:w-96 md:h-96 bg-slate-50 rounded-4xl border-2 border-slate-50 flex items-center justify-center overflow-hidden mb-8 group-hover:bg-white transition-colors">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-contain p-6 mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=QR+Code+Missing";
                  }}
                />
              </div>

              {/* ACTION BUTTON */}
            </div>
          </div>
        ))}
      </div>

     
    </section>
  );
};

export default QrCode;