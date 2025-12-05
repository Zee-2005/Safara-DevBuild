// app/(root)/index.tsx

import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LanguageSelector from "../components/screens/LanguageSelector";
import AuthScreen from "../components/screens/AuthScreen";
import HomeScreen from "../components/screens/HomeScreen";
import PersonalIdCreation from "../components/screens/PersonalIdCreation";
import PersonalIdDocsUpload from "../components/screens/PersonalIdDocsUpload";
import PersonalIdDetails from "../components/screens/PersonalIdDetails";
import PersonalIdDetailsModal from "../components/screens/PersonalIdDetailsModal";
import PersonalSafety from "../components/screens/Personalsafety";
import PlanTripHub from "../components/screens/PlanTripHub";
import AgencyBrowse from "../components/screens/AgencyBrowse";
import DirectIdQuick from "../components/screens/DirectIdQuick";
import TouristIdDocs from "../components/screens/TouristIdDocs";
import DocumentStorage from "../components/screens/DocumentStorage";

import { fetchAndSyncPersonalIdByEmail } from "../lib/personalId";

export default function Index() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [confirmedLanguage, setConfirmedLanguage] = useState<string | null>(
    null
  );
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);

  const [personalId, setPersonalId] = useState<string | null>(null);
  const [pidStep, setPidStep] = useState<null | "create" | "docs" | "details">(
    null
  );
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [showPersonalIdModal, setShowPersonalIdModal] = useState(false);
  const [personalIdInfo, setPersonalIdInfo] = useState<{
    pid: string | null;
    name: string | null;
    email: string | null;
    mobile: string | null;
    dob: string | null;
  }>({
    pid: null,
    name: null,
    email: null,
    mobile: null,
    dob: null,
  });

   const [hasActiveTour, setHasActiveTour] = useState(false);
  const [initialTourChecked, setInitialTourChecked] = useState(false);
  const [safetyActive, setSafetyActive] = useState(false);
  const [planTripActive, setPlanTripActive] = useState(false);
  const [agencyBrowseActive, setAgencyBrowseActive] = useState(false);
  const [touristIdDocsActive, setTouristIdDocsActive] = useState(false);
  const [directIdActive, setDirectIdActive] = useState(false);
  const [documentsActive, setDocumentsActive] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  

  useEffect(() => {
    if (userEmail) {
      fetchAndSyncPersonalIdByEmail(userEmail).then((pidData) => {
        if (pidData) setPersonalId(pidData.personalId);
        else setPersonalId(null);
      });
    }
  }, [userEmail]);

  useEffect(() => {
    if (!loggedInUser) {
      setPersonalId(null);
    } else {
      AsyncStorage.getItem(`pid_personal_id:${loggedInUser}`).then((pid) =>
        setPersonalId(pid)
      );
    }
  }, [loggedInUser, pidStep]);

  function handleLogin(phoneOrEmail: string) {
    setUserEmail(phoneOrEmail);
    setLoggedInUser(phoneOrEmail);
  }

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  if (!confirmedLanguage) {
    return (
      <LanguageSelector
        selectedLanguage={selectedLanguage}
        onLanguageSelect={setSelectedLanguage}
        onContinue={() => setConfirmedLanguage(selectedLanguage)}
      />
    );
  }

  if (!loggedInUser && !guestMode) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onGuestMode={() => setGuestMode(true)}
      />
    );
  }

  if (documentsActive && userEmail) {
  return (
    <DocumentStorage
      userEmail={userEmail}
      theme={theme}
      onBack={() => setDocumentsActive(false)}
    />
  );
}

  if (pidStep === "create") {
    return (
      <PersonalIdCreation
        onComplete={(data) => {
          setApplicationId(data.applicationId);
          setPidStep("docs");
        }}
        onBack={() => setPidStep(null)}
      />
    );
  }

  if (pidStep === "docs" && applicationId && loggedInUser) {
    return (
      <PersonalIdDocsUpload
        applicationId={applicationId}
        userId={loggedInUser}
        onBack={() => setPidStep("create")}
        onDone={async () => {
          const pid = await AsyncStorage.getItem(
            `pid_personal_id:${loggedInUser}`
          );
          setPersonalId(pid);
          setPidStep("details");
        }}
      />
    );
  }

  if (pidStep === "details") {
    return (
      <PersonalIdDetails
        onBack={() => setPidStep(null)}
        onShowQr={() => {}}
      />
    );
  }

  if (safetyActive) {
    return (
      <PersonalSafety
        isGuest={guestMode}
        onBack={() => setSafetyActive(false)}
      />
    );
  }

  if (agencyBrowseActive && userEmail) {
    return (
      <AgencyBrowse
        userEmail={userEmail}
        onBack={() => setAgencyBrowseActive(false)}
        onProceed={() => {
          setAgencyBrowseActive(false);
          setTouristIdDocsActive(true);
        }}
      />
    );
  }

  if (directIdActive && userEmail) {
    return (
      <DirectIdQuick
        userEmail={userEmail}
        onBack={() => setDirectIdActive(false)}
        onProceed={() => {
          setDirectIdActive(false);
          setTouristIdDocsActive(true);
        }}
      />
    );
  }

  if (touristIdDocsActive && userEmail) {
    return (
      <TouristIdDocs
        userEmail={userEmail}
        userId={loggedInUser || undefined}
        onBack={() => {
          setTouristIdDocsActive(false);
        }}
        onSubmitted={(isActive: boolean) => {
          setTouristIdDocsActive(false);
          setPlanTripActive(false);
        }}
      />
    );
  }

  if (planTripActive) {
    return (
      <PlanTripHub
        onBack={() => setPlanTripActive(false)}
        onNavigate={(section) => {
          if (section === "agencies") {
            setAgencyBrowseActive(true);
          } else if (section === "direct") {
            setDirectIdActive(true);
          } else if (section === "ai") {
            // Coming soon
          }
        }}
      />
    );
  }

  const handleShowPersonalIdDetails = async () => {
    if (!loggedInUser) return;
    const pid = await AsyncStorage.getItem(
      `pid_personal_id:${loggedInUser}`
    );
    const name = await AsyncStorage.getItem(
      `pid_full_name:${loggedInUser}`
    );
    const email = await AsyncStorage.getItem(
      `pid_email:${loggedInUser}`
    );
    const mobile = await AsyncStorage.getItem(
      `pid_mobile:${loggedInUser}`
    );
    const dob = await AsyncStorage.getItem(`pid_dob:${loggedInUser}`);
    setPersonalIdInfo({ pid, name, email, mobile, dob });
    setShowPersonalIdModal(true);
  };

  const bgColor = theme === "light" ? "#f9fafb" : "#020617";

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <HomeScreen
          userPhone={loggedInUser || undefined}
          userEmail={userEmail || undefined}
          isGuest={guestMode}
          personalId={personalId}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={(section) => {
            if (section === "personal-id" && personalId) {
              handleShowPersonalIdDetails();
            } else if (section === "personal-id") {
              setPidStep("create");
            } else if (section === "personal-safety") {
              setSafetyActive(true);
            } else if (section === "plan-journey") {
              setPlanTripActive(true);
            } else if (section === "documents") {
              setDocumentsActive(true);
            }
          }}
          onLogout={() => {
            setLoggedInUser(null);
            setGuestMode(false);
            setUserEmail(null);
            setConfirmedLanguage(null);
            setPersonalId(null);
            setHasActiveTour(false);
            setInitialTourChecked(false);
          }}
        onTouristStatusChange={(hasActive) => {
            setHasActiveTour(hasActive);
            if (hasActive) {
              // As soon as there is an active tour,
              // HomeScreen itself will automatically switch to Tour tab
              // via its internal effect. No extra redirect needed here.
            }
          }}
          onViewModeChange={() => {
            // optional: hook for analytics or future logic
          }}
        />
      </SafeAreaView>
      <PersonalIdDetailsModal
        visible={showPersonalIdModal}
        onClose={() => setShowPersonalIdModal(false)}
        pid={personalIdInfo.pid}
        name={personalIdInfo.name}
        email={personalIdInfo.email}
        mobile={personalIdInfo.mobile}
        dob={personalIdInfo.dob}
      />
    </>
  );
}
