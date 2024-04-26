const express = require('express');
const fs = require('fs');
let allTasks = require('./tasks.json');
const validators = require('./utils/validators');
const app = express();

app.use(express.json());
app.get('/',(req,res)=>{
    return res.status(200).send('GET SUCCESS');
});

function reload_task_manager(){
    fs.readFile('./tasks.json',{encoding:'utf-8',flag:'r'},(err,data)=>{
        if(err){
            console.log('Error loading taskmanager:',err);
        }try{
            allTasks = JSON.parse(data);
        }catch(error){
            console.log('Error parsing task manager',error);
        }
    });
}

app.get('/tasks',(req,res)=>{
    console.log('GET: tasks');
    if(allTasks.length==0){
        return res.status(404).send('No task available');
    }
    return res.status(200).json(allTasks);
});

app.get('/tasks/:id',(req,res)=>{
    const taskId = req.params.id;
    console.log('GET:{taskId}');
    if(allTasks.length ==0){
        return res.status(500).send('Internal server error');
    }else{
        const tasks = allTasks.tasks;
        const selectedTask = tasks.filter(task => task.id == taskId);
        if(selectedTask.length==0)
        {
            return res.status(404).send('Invalid task Id');
        }
        return res.status(200).json(selectedTask);
    }
});

app.delete('/tasks/:id',(req,res)=>{
    console.log('DELETE:{deleting task from taskmanager}');
    const taskId = req.params.id;
    if(allTasks.length==0){
        return res.status(500).send('Internal server error');
    }else{
        const tasks = allTasks.tasks;
        const filterdTasks = tasks.filter(task => task.id != taskId);
        if(filterdTasks.length==0){
            return res.status(404).send('No task associted with given id ${taskId}')
        }
        const newTasksList = { 'tasks':filterdTasks};
        //console.log('updated ',JSON.stringify(newTasksList));
        fs.writeFile('./tasks.json',JSON.stringify(newTasksList),{encoding:'utf-8',flag:'w'},(err)=>{
            if(err){
                return res.status(500).send('Failed to update taskmanger');
            }
            reload_task_manager();
            return res.status(200).send('Deleted Task id '+taskId+' from task manager');
        });
    }
});
app.put('/tasks/:id',(req,res)=>{
    console.log('PUT:{modifying task information}');
    const taskId = req.params.id;
    const selectedTask = validators.is_valid_task_id(allTasks.tasks,taskId);
    //console.log('task id:',taskId);
    //console.log('selectedTask:',selectedTask);
    if(selectedTask.status==false){
        return res.status(404).send('Invalid task id');
    }
    const modifiedTaskInfo = req.body;
    console.log('modifiedTaskInfo:',modifiedTaskInfo);
    //console.log('index:',allTasks);
    const fields_status = validators.validate_task_attributes(modifiedTaskInfo);
    console.log('fields_status:',fields_status);
    if(fields_status.status==false){
        return res.status(404).send('Invalid attrributes from task');
    }
    for(let key in modifiedTaskInfo){
        //console.log('key:',key);
        //console.log('from all tasks:',allTasks.Tasks[selectedTask.index][key]);
        //console.log('modifiedTaskInfo[key]:',modifiedTaskInfo[key]);
        allTasks.tasks[selectedTask.index][key] = modifiedTaskInfo[key];
    }
    //console.log('update objects:',allTasks.Tasks[selectedTask.index]);
    fs.writeFile('./tasks.json',JSON.stringify(allTasks),{encoding:'utf-8',flag:'w'},(err)=>{
        if(err){
            return res.status(500).send('Failed to update task');
        }
        reload_task_manager();
        return res.status(200).send('successfully updated task');
    });
});
app.post('/tasks',(req, res)=>{
    console.log('POST:{task information from body}');
    const newTask = req.body;
    const existingTasks = allTasks.tasks;
    const taskId = validators.get_task_id(existingTasks);
    //console.log('new task:',newTask);
    //console.log('new task id:',taskId);
    newTask.id = taskId;
    //console.log('new task after getting task id:',newTask);
    const validation = validators.validate_tasks(newTask);
    if(validation.status==false){
        return res.status(404).send('Invalid task');
    }
    allTasks.tasks.push(newTask);
    fs.writeFile('./tasks.json',JSON.stringify(allTasks),{encoding:'utf-8',flag:'w'}, (err) =>{
        if(err){
            return res.status(500).send('Failed to create new task');
        }
        reload_task_manager();
        return res.status(200).send('successfully written new task into task list');
    });
});
app.listen(3000,(err)=>{
    if(err)
    {
        console.log('unable to start server 3000');
    }else{
        console.log('server started on 3000 port');
    }
});