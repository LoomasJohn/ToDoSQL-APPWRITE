import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button } from "react-native-paper";
import { syncTasks } from "../lib/syncTasks"; // Ensure sync function is available

export default function ItemModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const database = useSQLiteContext();

  // ✅ Restoring state for form inputs
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [editMode, setEditMode] = useState(false);

  // ✅ Load data if editing an existing task
  useEffect(() => {
    if (id) {
      setEditMode(true);
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
        const result = await database.getFirstAsync<{ 
            id: number; 
            name: string; 
            description: string; 
            incident_type: string; 
            severity: string; 
            status: string; 
            reported_by: string;
        }>(
            "SELECT * FROM tasks WHERE id = ?", 
            [id ? parseInt(id as string, 10) : 0]
        );

        if (result) {
            setName(result.name);
            setDescription(result.description);
            setIncidentType(result.incident_type);
            setSeverity(result.severity);
            setStatus(result.status);
            setReportedBy(result.reported_by);
        }
    } catch (error) {
        console.error("❌ Error loading item:", error);
        Alert.alert("Error", "Failed to load the Task");
    }
};


const handleSave = async () => {
  if (!name.trim() || !description.trim() || !incidentType.trim() || !severity.trim() || !status.trim() || !reportedBy.trim()) {
    Alert.alert("Error", "Please fill in all fields");
    return;
  }

  try {
    if (editMode) {
      await database.runAsync(
        "UPDATE tasks SET name = ?, description = ?, incident_type = ?, severity = ?, status = ?, reported_by = ? WHERE id = ?",
        [name.trim(), description.trim(), incidentType.trim(), severity.trim(), status.trim(), reportedBy.trim(), Number(id)] // ✅ Ensure id is a number
      );
    } else {
      await database.runAsync(
        "INSERT INTO tasks (name, description, completed, incident_type, severity, status, reported_by) VALUES (?, ?, 0, ?, ?, ?, ?)",
        [name.trim(), description.trim(), incidentType.trim(), severity.trim(), status.trim(), reportedBy.trim()]
      );
    }

    console.log("✅ Task saved. Syncing with Appwrite...");
    await syncTasks(database);

    router.push("/todos");
  } catch (error) {
    console.error("❌ Error saving task:", error);
    Alert.alert("Error", "Failed to save Task");
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: editMode ? "Edit Task" : "Add Task",
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.formContainer}>
          <TextInput label="Title" value={name} onChangeText={setName} />
          <TextInput label="Description" value={description} onChangeText={setDescription} />
          <TextInput label="Incident Type" value={incidentType} onChangeText={setIncidentType} />
          <TextInput label="Severity" value={severity} onChangeText={setSeverity} />
          <TextInput label="Status" value={status} onChangeText={setStatus} />
          <TextInput label="Reported By" value={reportedBy} onChangeText={setReportedBy} />
        </View>

        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={handleSave}>Save Task</Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ Styling restored
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

