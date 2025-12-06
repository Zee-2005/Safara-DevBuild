// src/components/screens/DocumentStorage.tsx

import React, { useEffect, useState } from "react";
import {API_BASE} from "../../config/api";
import {SafeAreaView} from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";

import Button from "../ui/Button";
import Badge from "../ui/Badge";

type UserDoc = {
  id: string;
  title: string;
  description?: string | null;
  mime: string;
  size: number;
  secureUrl: string;
  createdAt: string;
  updatedAt: string;
};

interface Props {
  userEmail: string;
  theme: "light" | "dark";
  onBack: () => void;
}

// const API_BASE = "http://192.168.0.100:3000/api/v1";

export default function DocumentStorage({ userEmail, theme, onBack }: Props) {
  const [docs, setDocs] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";

  const bg = isDark ? "#020617" : "#f9fafb";
  const cardBg = isDark ? "#020617" : "#ffffff";
  const textMain = isDark ? "#f9fafb" : "#111827";
  const textSub = isDark ? "#9ca3af" : "#6b7280";
  const border = isDark ? "#1f2937" : "#e5e7eb";

  async function loadDocs() {
    try {
      setLoading(true);
      const url = `${API_BASE}/docs?userId=${encodeURIComponent(userEmail)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to load documents (${res.status}): ${t}`);
      }
      const json = await res.json();
      setDocs(json.docs || []);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocs();
  }, []);

  async function handleUpload() {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (pick.canceled) return;

      const asset = pick.assets[0];
      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name: asset.name || "document",
        type: asset.mimeType || "application/octet-stream",
      } as any);
      form.append("title", asset.name || "Document");
      form.append("userId", userEmail);

      const res = await fetch(`${API_BASE}/docs`, {
        method: "POST",
        // Do NOT set Content-Type manually; RN will add correct boundary.
        body: form,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Upload failed (${res.status}): ${t}`);
      }
      await loadDocs();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to upload document");
    }
  }

  async function handleDelete(id: string) {
    Alert.alert("Delete", "Delete this document permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/docs/${id}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": userEmail,
              },
            });
            if (!res.ok) {
              const t = await res.text();
              throw new Error(`Delete failed (${res.status}): ${t}`);
            }
            setDocs((prev) => prev.filter((d) => d.id !== id));
          } catch (e: any) {
            Alert.alert(
              "Error",
              e?.message || "Failed to delete document"
            );
          }
        },
      },
    ]);
  }

  async function handleQuickRename(doc: UserDoc) {
    const newTitle = doc.title.endsWith(" (edited)")
      ? doc.title
      : `${doc.title} (edited)`;
    try {
      const res = await fetch(`${API_BASE}/docs/${doc.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userEmail,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Update failed (${res.status}): ${t}`);
      }
      await loadDocs();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update document");
    }
  }

  return (
    <SafeAreaView
    style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#f9fafb" }}
    edges={["top", "left", "right"]}
    >

    
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#020617" : "#ffffff", borderColor: border },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={18} color="#2563eb" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: textMain }]}>
            Documents
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSub }]}>
            Store and manage your personal travel files
          </Text>
        </View>
        <Button onPress={handleUpload}>
          <Text style={styles.uploadText}>Upload</Text>
        </Button>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {loading && (
          <Text style={{ color: textSub, marginBottom: 8 }}>
            Loading documents...
          </Text>
        )}
        {docs.map((d) => (
          <View
            key={d.id}
            style={[
              styles.docCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.docRow}>
              <View style={styles.iconCircle}>
                <Feather name="file-text" size={18} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.docTitle, { color: textMain }]}>
                  {d.title}
                </Text>
                <Text style={[styles.docMeta, { color: textSub }]}>
                  {(d.size / 1024).toFixed(1)} KB •{" "}
                  {new Date(d.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Badge variant="outline">
                <Text style={{ fontSize: 10, color: textSub }}>
                  {d.mime.split("/")[1] || "file"}
                </Text>
              </Badge>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Open",
                    "Use WebView / browser to open this URL:\n\n" +
                      d.secureUrl
                  );
                }}
              >
                <Text style={styles.actionText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleQuickRename(d)}>
                <Text style={styles.actionText}>Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(d.id)}>
                <Text style={[styles.actionText, { color: "#ef4444" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && docs.length === 0 && (
          <Text style={{ color: textSub, marginTop: 8 }}>
            No documents yet. Upload files like tickets, hotel vouchers, and
            IDs here.
          </Text>
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.08)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  uploadText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  docCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  docMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 8,
    columnGap: 16,
  },
  actionText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
});
