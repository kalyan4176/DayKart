'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RefundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Cancellation, Return & Refund Policy</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {/* Refund & Cancellation Section */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Refund and Cancellation Policy</h2>
            <p className="mb-4 text-xs">
              This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service that you have purchased through the Platform. Under this policy:
            </p>
            <ul className="list-decimal pl-6 space-y-4 text-xs">
              <li>
                Cancellations will only be considered if the request is made <strong>1 days</strong> of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers / merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep.
              </li>
              <li>
                <strong>ADHILAKSHMI ENTERPRISES</strong> does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good.
              </li>
              <li>
                In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/ merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within <strong>1 days</strong> of receipt of products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within <strong>1 days</strong> of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.
              </li>
              <li>
                In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.
              </li>
              <li>
                In case of any refunds approved by <strong>ADHILAKSHMI ENTERPRISES</strong>, it will take <strong>2 days</strong> for the refund to be processed to you.
              </li>
              <li>
                <strong>Failed Online Transactions & Double Debits:</strong> In the event of a failed online transaction or double debit where money is deducted from your account/card but the order is not created or placed successfully, the amount will be automatically refunded back to your original payment source within <strong>5 to 7 business days</strong>, in accordance with bank policies.
              </li>
            </ul>
          </div>

          {/* Return Policy Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Return Policy</h2>
            <p className="text-xs mb-4">
              We offer refund / exchange within first <strong>1 days</strong> from the date of your purchase. If <strong>1 days</strong> have passed since your purchase, you will not be offered a return, exchange or refund of any kind.
            </p>
            <p className="text-xs mb-4">
              In order to become eligible for a return or an exchange, (i) the purchased item should be unused and in the same condition as you received it, (ii) the item must have original packaging, (iii) if the item that you purchased on a sale, then the item may not be eligible for a return / exchange. Further, only such items are replaced by us (based on an exchange request), if such items are found defective or damaged.
            </p>
            <p className="text-xs mb-4">
              You agree that there may be a certain category of products / items that are exempted from returns or refunds. Such categories of the products would be identified to you at the item of purchase.
            </p>
            <p className="text-xs">
              For exchange / return accepted request(s) (as applicable), once your returned product / item is received and inspected by us, we will send you an email to notify you about receipt of the returned / exchanged product. Further, if the same has been approved after the quality check at our end, your request (i.e. return / exchange) will be processed in accordance with our policies.
            </p>
          </div>

          {/* Contact Details */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 text-xs text-slate-500">
            <p><strong>Legal Entity Name:</strong> ADHILAKSHMI ENTERPRISES</p>
            <p><strong>Udyam Registration No:</strong> UDYAM-AP-17-0054999</p>
            <p><strong>Registered Address:</strong> 1-38 Pedda Veedhi, Kandrakota, Peddapuram, Andhra Pradesh, India</p>
            <p><strong>Contact Email:</strong> daykart.services@gmail.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
