"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/app/lib/firebaseConfig'; // Adjust the path as needed
import { collection, doc, setDoc } from 'firebase/firestore';

const InvoiceForm = ({ invoiceData, userID, chatID }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [items, setItems] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [taxesAndFees, setTaxesAndFees] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [couponSavings, setCouponSavings] = useState(invoiceData["Coupon savings"]);
  const [taxes, setTaxes] = useState(invoiceData["Taxes and fees"]);
  const [initialGrandTotal, setInitialGrandTotal] = useState(0); // Store the initial grand total

  function storeTransactionInfo(transaction_info) {
    const userRef = doc(db, "transactions", transaction_info.chatID);

    return setDoc(userRef, {
      chatID: transaction_info.chatID,
      personbItems: transaction_info.personbItems,
      personbPaymentAmount: transaction_info.personbPaymentAmount,
      grandTotal: transaction_info.grandTotal
    });
  }

  useEffect(() => {
    // Initialize checked items state and items state
    const initialCheckedItems = {};
    const initialItems = invoiceData.Items.map((item, index) => {
      initialCheckedItems[index] = true;
      return { name: item[0], price: item[1] };
    });
    setCheckedItems(initialCheckedItems);
    setItems(initialItems);

    // Calculate the initial grand total with all items checked
    const initialSubTotal = initialItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const initialTaxesAndFees = (initialSubTotal / invoiceData["Sub total"]) * parseFloat(taxes);
    const initialGrandTotal = initialSubTotal + initialTaxesAndFees - Math.abs(parseFloat(couponSavings));
    setInitialGrandTotal(initialGrandTotal);
  }, [invoiceData, taxes, couponSavings]);

  useEffect(() => {
    // Calculate totals whenever checkedItems or items change
    const checkedItemsArray = items.filter((_, index) => checkedItems[index]);
    const newSubTotal = checkedItemsArray.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const newTaxesAndFees = (newSubTotal / invoiceData["Sub total"]) * parseFloat(taxes);
    const newGrandTotal = newSubTotal + newTaxesAndFees - Math.abs(parseFloat(couponSavings));

    setSubTotal(newSubTotal);
    setTaxesAndFees(newTaxesAndFees);
    setGrandTotal(newGrandTotal);
  }, [checkedItems, items, taxes, couponSavings, invoiceData]);

  const handleCheckboxChange = (index) => {
    setCheckedItems((prevCheckedItems) => {
      const newCheckedItems = { ...prevCheckedItems, [index]: !prevCheckedItems[index] };
      return newCheckedItems;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index][field] = value;
      return newItems;
    });
  };

  const handleCouponSavingsChange = (value) => {
    setCouponSavings(value);
  };

  const handleTaxesChange = (value) => {
    setTaxes(value);
  };

  const addItem = () => {
    setItems((prevItems) => [
      ...prevItems,
      { name: '', price: 0 }
    ]);
    setCheckedItems((prevCheckedItems) => ({
      ...prevCheckedItems,
      [items.length]: true
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Get the unchecked items for personb
      const personbItems = items.filter((_, index) => !checkedItems[index]);
      const personbSubTotal = personbItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
      const personbTaxesAndFees = (personbSubTotal / invoiceData["Sub total"]) * parseFloat(taxes);
      const personbPaymentAmount = personbSubTotal + personbTaxesAndFees;

      const formData = {
        chatID: chatID,
        personbItems: personbItems,
        personbPaymentAmount: personbPaymentAmount,
        grandTotal: initialGrandTotal // Use the initial grand total
      };

      await storeTransactionInfo(formData);
      console.log("Document written with ID: ", chatID);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Invoice Details</h3>
      <form onSubmit={handleSubmit}>
        {items.map((item, index) => (
          <div key={index}>
            <input
              type="checkbox"
              checked={checkedItems[index] || false}
              onChange={() => handleCheckboxChange(index)}
            />
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <input
              type="number"
              value={item.price}
              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
              style={{ marginRight: '10px' }}
            />
          </div>
        ))}
        <button type="button" onClick={addItem} style={{ marginTop: '10px' }}>+ Add Item</button>
        <div>
          <label>Coupon savings: </label>
          <input
            type="number"
            value={couponSavings}
            onChange={(e) => handleCouponSavingsChange(e.target.value)}
            style={{ marginRight: '10px' }}
          />
        </div>
        <div>
          <label>Sub-total: ${subTotal.toFixed(2)}</label>
        </div>
        <div>
          <label>Taxes and fees: </label>
          <input
            type="number"
            value={taxes}
            onChange={(e) => handleTaxesChange(e.target.value)}
            style={{ marginRight: '10px' }}
          />
        </div>
        <div>
          <label>Grand total: ${grandTotal.toFixed(2)}</label>
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>Submit Changes</button>
      </form>
    </div>
  );
};

export default InvoiceForm;