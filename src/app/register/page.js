'use client'
import { useState } from "react";
import { db } from "../lib/firebaseConfig.js";
import { doc, setDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useRouter } from 'next/navigation';
import "./style.css";
import { getAccountName, getAccountBalance, createAndGetAccount, changeAccountBalance, transaction, getAccount } from "../../../lib/api_endpoints";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

//userdata should be a json file with the following fields:
//username, firstName, lastName, profilePictureURL, email, phoneNumber, bio, rating, completedOrders, addresses
//addresses should be a list of json objects with the following fields:
//street, city, state, zip, isPrimary

async function storeUserData(userdata) {
    const userRef = doc(db, "users", userdata.username);

    const customerData = {
      "first_name": userdata.firstName, 
      "last_name": userdata.lastName,
      "address": {
          "street_number": "88",
          "street_name": "monkey ave",
          "city": "Needham",
          "state": "MA",
          "zip": "02492"
      }
    }

    const accountData = {
      "type": "Credit Card", 
      "nickname": "5000", 
      "rewards": 0, 
      "balance": 5000
    }

    const new_account_id = await createAndGetAccount(customerData, accountData);
  
    return setDoc(userRef, {
      username: userdata.username,
      firstName: userdata.firstName,
      lastName: userdata.lastName,
      profilePictureURL: userdata.profilePictureURL,
      email: userdata.email,
      phoneNumber: userdata.phoneNumber,
      bio: userdata.bio,
      rating: userdata.rating,
      completedOrders: userdata.completedOrders,
      addresses: userdata.addresses,
      accountID: new_account_id
    });
  }
  

export default function LoginForm({ className }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailp = searchParams.get("email");
  const profilepic = searchParams.get("pfp");
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email:emailp,
    profilePictureURL: profilepic,
    phoneNumber: "",
    bio: "",
    rating: 0,
    completedOrders: 0,
    addresses: "",
  });

  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);

  const validateInputs = () => {
    let newErrors = {};

    // Phone Number Validation: Must be exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    // ZIP Code Validation: Exactly 5 digits
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(formData.addresses)) {
      newErrors.addresses = "ZIP code must be exactly 5 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // True if no errors
  };

  const handleRegister = async (e) => {
    e.preventDefault();
  
    if (validateInputs()) {
      const userData = { ...formData };
      setSubmittedData(userData);
  
      try {
        await storeUserData(userData);  // Await Firestore operation
        console.log("User Data JSON:", JSON.stringify(userData, null, 2));
        alert("Registration successful!");
        router.push(`/view/${userData.addresses}/${userData.username}`);
      } catch (error) {
        console.error("Error storing user data:", error);
        alert("Registration failed! Please try again.");
      }
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Strip out non-digit characters for the phoneNumber input
    if (name === "phoneNumber") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") }); // Remove all non-digit characters
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className={cn("flex flex-col gap-6", className)}>
        <form className="form" onSubmit={handleRegister}>
          <div className="flex-column">
            <label>Username</label>
          </div>
          <div className="inputForm">
            <input
              name="username"
              placeholder="Enter your Username"
              className="input placeholder-black text-black"
              type="text"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="flex-column">
            <label>First Name </label>
          </div>
          <div className="inputForm">
            <input
              name="firstName"
              placeholder="Enter your First Name"
              className="input placeholder-gray-500 text-black"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="flex-column">
            <label>Last Name</label>
          </div>
          <div className="inputForm">
            <input
              name="lastName"
              placeholder="Enter your Last Name"
              className="input placeholder-gray-500 text-black"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="flex-column">
            <label>Phone Number</label>
          </div>
          <div className="inputForm">
            <input
              name="phoneNumber"
              placeholder="Enter your 10-digit Phone Number"
              className="input placeholder-gray-500 text-black"
              type="text"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength="10" // Prevents input longer than 10 digits
            />
          </div>
          {errors.phoneNumber && <p className="text-red-500">{errors.phoneNumber}</p>}

          <div className="flex-column">
            <label>Zip Code</label>
          </div>
          <div className="inputForm">
            <input
              name="addresses"
              placeholder="Enter your Zip Code"
              className="input placeholder-gray-500 text-black"
              type="text"
              value={formData.addresses}
              onChange={handleChange}
            />
          </div>
          {errors.addresses && <p className="text-red-500">{errors.addresses}</p>}

          <button type="submit" className="button-submit">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}