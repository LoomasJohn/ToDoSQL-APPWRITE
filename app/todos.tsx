import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, FAB } from "react-native-paper"; 
import { syncTasks } from "../lib/syncTasks"; 

export default function TabHome() {
  const [data, setData] = useState<{ id: number; name: string }[]>([]);
  const database = useSQLiteContext();

  useFocusEffect(
    useCallback(() => {
      syncTasks(database);
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const result = await database.getAllAsync<{ id: number; name: string }>("SELECT id, name FROM tasks");
      setData(result);
    } catch (error) {
      console.error("Error loading data:", error);
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
            <Text style={styles.taskText}>{item.name}</Text>
            <Button mode="contained" onPress={() => router.push(`/addtodo?id=${item.id}`)}>
              Edit
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
