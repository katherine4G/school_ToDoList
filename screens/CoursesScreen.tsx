// screens/CoursesScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import WheelColorPicker from 'react-native-wheel-color-picker';

// 👇 Animación para Android clásico
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Course {
  id: string;
  name: string;
  professor?: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseColors, setCourseColors] = useState<{ [courseId: string]: string }>({});
  const [courseName, setCourseName] = useState('');
  const [professorName, setProfessorName] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [editedCourseName, setEditedCourseName] = useState('');
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [selectedCourseForColor, setSelectedCourseForColor] = useState<Course | null>(null);
  const [tempColor, setTempColor] = useState('#4CAF50');

  useEffect(() => {
    const loadData = async () => {
      const storedCourses = await AsyncStorage.getItem('@courses');
      const storedColors = await AsyncStorage.getItem('@courseColors');
      if (storedCourses) setCourses(JSON.parse(storedCourses));
      if (storedColors) setCourseColors(JSON.parse(storedColors));
    };
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    AsyncStorage.setItem('@courseColors', JSON.stringify(courseColors));
  }, [courseColors]);

  const addCourse = () => {
    if (!courseName.trim()) {
      Alert.alert('Error', 'Course name is required.');
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName.trim(),
      professor: professorName.trim() || undefined,
    };
    setCourses([newCourse, ...courses]);
    setCourseName('');
    setProfessorName('');
  };

  const deleteCourse = (id: string) => {
    Alert.alert('Delete Course', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCourses(courses.filter(c => c.id !== id));

          const updatedColors = { ...courseColors };
          delete updatedColors[id];
          setCourseColors(updatedColors);
        },
      },
    ]);
  };

  const startEditCourse = (course: Course) => {
    setEditedCourseName(course.name);
    setCourseToEdit(course);
    setEditModalVisible(true);
  };

  const saveEditedCourse = () => {
    if (courseToEdit) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCourses(courses.map(c =>
        c.id === courseToEdit.id
          ? { ...c, name: editedCourseName.trim() || c.name }
          : c
      ));
      setEditModalVisible(false);
    }
  };

  const openColorPicker = (course: Course) => {
    setSelectedCourseForColor(course);
    setTempColor(courseColors[course.id] || '#4CAF50');
    setColorModalVisible(true);
  };

  const saveCourseColor = () => {
    if (selectedCourseForColor) {
      setCourseColors(prev => ({
        ...prev,
        [selectedCourseForColor.id]: tempColor,
      }));
    }
    setColorModalVisible(false);
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{item.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => startEditCourse(item)}>
            <Ionicons name="pencil" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openColorPicker(item)}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="color-palette" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteCourse(item.id)}>
            <Ionicons
              name="trash"
              size={20}
              color="#E53935"
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
        </View>
      </View>
      {item.professor && (
        <Text style={styles.professor}>👨‍🏫 {item.professor}</Text>
      )}
    {courseColors[item.id] && (
    <View
        style={[
        styles.colorPreview,
        { backgroundColor: courseColors[item.id] || '#999999' },
        ]}
    >
        <Text style={styles.colorText}>Color</Text>
    </View>
    )}

    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 My Courses</Text>

      <View style={styles.inputSection}>
        <TextInput
          placeholder="Course name"
          style={styles.input}
          value={courseName}
          onChangeText={setCourseName}
        />
        <TextInput
          placeholder="Professor (optional)"
          style={styles.input}
          value={professorName}
          onChangeText={setProfessorName}
        />
        <Button title="Add Course" onPress={addCourse} />
      </View>

      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={renderCourseItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No courses added yet!</Text>
        }
      />

      {/* ✅ MODAL Edit Course */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Course</Text>
            <TextInput
              style={styles.input}
              value={editedCourseName}
              onChangeText={setEditedCourseName}
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={saveEditedCourse} />
              <View style={{ width: 10 }} />
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL Color Picker */}
<Modal
  visible={colorModalVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setColorModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Pick Color</Text>
        <View style={{ height: 200 }}>
        <WheelColorPicker
            color={tempColor}
            onColorChangeComplete={setTempColor}
            thumbSize={30}
            sliderSize={20}
            swatches={false}
            discrete={false}
        />
        </View>

        <Button title="Save Color" onPress={saveCourseColor} />
        <Button title="Close" onPress={() => setColorModalVisible(false)} />

    </View>
  </View>
</Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  inputSection: { marginBottom: 20 },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 5,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseName: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  professor: { marginTop: 8, color: '#555' },
  colorPreview: {
    marginTop: 8,
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  colorText: { fontSize: 12, color: '#fff' },
  empty: { textAlign: 'center', color: '#777', marginTop: 20 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 20, marginBottom: 10 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});
