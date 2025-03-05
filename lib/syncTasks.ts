import { SQLiteAnyDatabase } from "expo-sqlite/build/NativeStatement";
import { Databases, Account } from "appwrite";
import { client } from "../lib/appwriteConfig"; // Ensure Appwrite is correctly configured

const databases = new Databases(client);
const account = new Account(client);

export async function syncTasks(database: SQLiteAnyDatabase) {
  try {
      // ✅ Ensure the user is authenticated
      const user = await account.get();
      const userId = user.$id;

      // ✅ Get all local tasks that haven't been synced
      const localTasks = await database.getAllAsync(
          "SELECT id, name, description, completed, incident_type, severity, status, reported_by, created_at FROM tasks WHERE appwrite_id IS NULL"
      );    

      for (const task of localTasks) {
          console.log(`🔄 Syncing Task: ${task.name}`);

          // ✅ Ensure `documentId` is an integer, then convert to string for Appwrite
          const documentId = (task.id ? parseInt(task.id, 10) : Date.now()).toString();

          const response = await databases.createDocument(
              '67c60e9f00337e9a3166', // Database ID
              '67c61487003bbec84e25', // Collection ID
              documentId, // ✅ Pass as a string (required by Appwrite)
              {
                  id: Number(documentId), // ✅ Convert back to number for Appwrite's schema
                  name: task.name,
                  description: task.description,
                  completed: Boolean(task.completed),
                  incident_type: task.incident_type,
                  severity: task.severity,
                  status: task.status,
                  reported_by: task.reported_by,
                  created_at: task.created_at || new Date().toISOString(),
              }
          );

          // ✅ Update SQLite with Appwrite ID
          await database.runAsync(
              "UPDATE tasks SET appwrite_id = ? WHERE id = ?",
              [response.$id, task.id]
          );

          console.log(`✅ Task Synced: ${task.name} (Appwrite ID: ${response.$id})`);
      }

      console.log("✅ Sync complete. All unsynced tasks now have Appwrite IDs.");
  } catch (error) {
      console.error("❌ Sync failed:", error);
  }
}
