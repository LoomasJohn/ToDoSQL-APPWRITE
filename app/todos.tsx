import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, FAB } from "react-native-paper"; 
import { syncTasks } from "../lib/syncTasks"; 
import { Databases } from "appwrite";
import { client } from "../lib/appwriteConfig";

const databases = new Databases(client);


export default function TabHome() {
  const [data, setData] = useState<{ id: number; name: string; completed: number }[]>([]);
  const database = useSQLiteContext();

  useFocusEffect(
    useCallback(() => {
      syncTasks(database);
      loadData();
    }, [])
  );

  const loadData = async () => {
  try {
    const result = await database.getAllAsync<{ id: number; name: string; completed: number }>(
      "SELECT id, name, completed FROM tasks"
    );
    

    setData(result);
  } catch (error) {
    console.error("Error loading data:", error);
  }
};


  const toggleComplete = async (taskId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus ? 0 : 1;
  
      // ✅ Update SQLite
      await database.runAsync("UPDATE tasks SET completed = ? WHERE id = ?", [newStatus, taskId]);
  
      // ✅ Sync with Appwrite
      const task = await database.getFirstAsync<{ appwrite_id: string }>(
        "SELECT appwrite_id FROM tasks WHERE id = ?",
        [taskId]
      );
  
      if (task?.appwrite_id) {
        await databases.updateDocument(
          '67c60e9f00337e9a3166', // Database ID
          '67c61487003bbec84e25', // Collection ID
          task.appwrite_id,
          { completed: Boolean(newStatus) }
        );
      }
  
      loadData();
    } catch (error) {
      console.error("❌ Error updating completion status:", error);
    }
  };
  
  const deleteTask = async (taskId: number) => {
    try {
      // ✅ Delete from SQLite
      await database.runAsync("DELETE FROM tasks WHERE id = ?", [taskId]);
  
      // ✅ Delete from Appwrite if synced
      const task = await database.getFirstAsync<{ appwrite_id: string }>(
        "SELECT appwrite_id FROM tasks WHERE id = ?",
        [taskId]
      );
  
      if (task?.appwrite_id) {
        await databases.deleteDocument(
          '67c60e9f00337e9a3166', // Database ID
          '67c61487003bbec84e25', // Collection ID
          task.appwrite_id
        );
      }
  
      loadData();
    } catch (error) {
      console.error("❌ Error deleting task:", error);
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Task List" }} />
      <FlatList
  data={data}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.taskContainer}>
      <Text style={[styles.taskText, item.completed ? styles.completedTask : null]}>
        {item.name}
      </Text>

      <Button mode="contained" onPress={() => toggleComplete(item.id, item.completed)}>
        {item.completed ? "Undo" : "Complete"}
      </Button>

      <Button mode="contained" color="red" onPress={() => deleteTask(item.id)}>
        Delete
      </Button>
    </View>
  )}
/>


      {/* ✅ Add Task Button Restored */}
      <FAB 
        style={styles.fab} 
        icon="plus" 
        label="Add Task"
        onPress={() => router.push("/addtodo")} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "gray",
  },  
  taskContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginVertical: 8,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskText: {
    fontSize: 16,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#6200ea",
  },
});
