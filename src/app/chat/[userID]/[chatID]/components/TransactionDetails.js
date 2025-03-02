"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/app/lib/firebaseConfig';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  collection, 
  where, 
  getDocs 
} from 'firebase/firestore';

const TransactionDetails = ({ chatID }) => {
  const [listing, setListing] = useState(null);
  const [listingID, setListingID] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Immediately on mount, set listingID from chatMetadata
  useEffect(() => {
    async function fetchListingID() {
      try {
        if (chatID) {
          const chatMetadataRef = doc(db, "chatMetadata", chatID);
          const chatMetadataDoc = await getDoc(chatMetadataRef);
          if (chatMetadataDoc.exists()) {
            const metadata = chatMetadataDoc.data();
            const listID = metadata.listingID;
            setListingID(listID);
          } else {
            console.error("No chatMetadata found for chatID:", chatID);
          }
        }
      } catch (error) {
        console.error("Error fetching listing ID:", error);
      }
    }
    fetchListingID();
  }, [chatID]);

  // Once listingID has been set (and chatID is available), fetch the listing and transaction data.
  useEffect(() => {
    async function fetchData() {
      try {
        if (chatID) {
          if (listingID) {
            // Fetch listing document using listingID from "listings" collection
            const listingRef = doc(db, "listings", listingID);
            const listingDoc = await getDoc(listingRef);
            if (listingDoc.exists()) {
              setListing({ ...listingDoc.data(), listingID });
            } else {
              console.error("No listing found for listingID:", listingID);
            }
          }
          // Query the transactions collection using chatID
          const transactionsQuery = query(
            collection(db, "transactions"),
            where("chatID", "==", chatID)
          );
          const querySnapshot = await getDocs(transactionsQuery);
          if (!querySnapshot.empty) {
            // Use the first matching transaction document
            const txDoc = querySnapshot.docs[0];
            setTransaction(txDoc.data());
          } else {
            console.error("No transaction found for chatID:", chatID);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [chatID, listingID]);

  if (loading) {
    return <div>Loading transaction details...</div>;
  }

  if (!transaction) {
    return <div>No transaction data available.</div>;
  }

  // Calculate sum of all item prices using a for loop
  let itemsTotal = 0;
  for (const item of transaction.personbItems) {
    itemsTotal += parseFloat(item.price);
  }
  // Taxes and Fees computed as Grand Total minus the sum of all item prices
  const taxesAndFees = transaction.grandTotal - itemsTotal;

  const confirmTransaction = async () => {
    if (!listingID) {
      alert("Listing ID is not available.");
      return;
    }
    setUpdating(true);
    try {
      const txRef = doc(db, "listings", listingID);
      // Update listing status to "fulfilled"
      await updateDoc(txRef, { status: "fulfilled" });
      setTransaction((prev) => ({ ...prev, status: "fulfilled" }));
      alert("Transaction confirmed. The other user will pay and you will receive pickup details shortly.");
    } catch (error) {
      console.error("Error confirming transaction:", error);
      alert("Error confirming transaction.");
    } finally {
      setUpdating(false);
    }
  };

  const cancelTransaction = async () => {
    if (!listingID) {
      alert("Listing ID is not available.");
      return;
    }
    setUpdating(true);
    try {
      const txRef = doc(db, "listings", listingID);
      // Update listing status to "active"
      await updateDoc(txRef, { status: "active" });
      setTransaction((prev) => ({ ...prev, status: "active" }));
      alert("Transaction declined. The listing is now active again and the other use is notified.");
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      alert("Error cancelling transaction.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}>
      <h2>Transaction Details</h2>
      <p>
        <strong>Full Order Amount:</strong> ${transaction.grandTotal.toFixed(2)}
      </p>
      <h3>Items:</h3>
      <ul>
        {transaction.personbItems.map((item, index) => (
          <li key={index}>
            {item.name} - ${parseFloat(item.price).toFixed(2)}
          </li>
        ))}
      </ul>
      <p>
        <strong>Sub total:</strong> ${itemsTotal.toFixed(2)}
      </p>
      <p>
        <strong>Taxes and Fees:</strong> ${taxesAndFees.toFixed(2)}
      </p>
      <p>
        <strong>Your Payment Amount:</strong> ${transaction.personbPaymentAmount.toFixed(2)}
      </p>
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={confirmTransaction}
          disabled={updating}
          style={{ marginRight: "1rem", padding: "0.5rem 1rem" }}
        >
          Confirm Transaction
        </button>
        <button
          onClick={cancelTransaction}
          disabled={updating}
          style={{ padding: "0.5rem 1rem" }}
        >
          Cancel Transaction
        </button>
      </div>
    </div>
  );
};

export default TransactionDetails;