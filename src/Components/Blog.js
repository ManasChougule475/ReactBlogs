//Blogging App using Hooks
import { useState,useRef,useEffect,useReducer,createRef} from "react";
import {db} from "../firebaseInit";
import { collection , doc , addDoc, setDoc , getDocs } from "firebase/firestore"; 


function blogsReducer(state , action){
    switch(action.type){
        case "Add Blog":
            return [action.blog , ...state];
        case "Remove Blog":
            return state.filter((blog,index) => index!==action.index);
        case 'Update Blog':
            return state.map((blog, index) =>
                index === action.index ? { ...blog, content: action.new_content , title:action.new_title } : blog  
                // { ...blog, content: action.content }: If the index matches the action.index, it creates a new object that copies
                // all the properties from the current blog using the spread operator (...blog). Then, it updates the content property 
                // of this new object with the value provided in action.content. This effectively updates the content of the specific blog.
            );
        case 'Reload':
            return [...action.all_blogs];
        default:
            return [];
    }
}

export default function Blog(){

    // const [title,setTitle] = useState("");
    // const [content,setContent] = useState("");
    const [formData,setFormData]=useState({ title:"", content:"" }); // title & content gets updated at same time hence combined into single object

    // const [blogs, setBlogs] =  useState([]);
    const [blogs,dispatch] = useReducer(blogsReducer, []); 

    const titleRef = useRef(null); // to bring focus on title of form

    // update :-
    const [updateIndex, setUpdateIndex] = useState(-1);  // Creating an array of refs for content fields will not work
    const [updatedTitle , setUpdatedTitle] = useState("")
    const [updatedContent, setUpdatedContent] = useState(""); // State to store the currently Updated content

    const [contentRefs, setContentRefs] = useState([]); // to bring focus on content of blog that user wants to update

    useEffect(()=>{  
        titleRef.current.focus(); // focus goes onto title fiels when app renders or reloads
    },[]);

    useEffect(()=>{
        if(blogs.length){
            blogs[0].title ? document.title = blogs[0].title : document.title = "No Title!"
        }else{
            document.title = "No Blogs!!";
        }
    },[blogs])


    useEffect(()=>{
        async function fetchData(){
            const snapShot = await getDocs(collection(db, "blogs"));
            const blogs = snapShot.docs.map((doc)=>{
                return {
                    id:doc.id,
                    ...doc.data()
                }
            })

            // snapShot.forEach((doc)=>{
            //     console.log(doc.data().content,doc.data().createdOn.seconds );
            // })  // doc.data().createdOn.seconds gives time when blog is created

            // sort blogs based on the timestamp
            blogs.sort((a, b) => b.createdOn.seconds - a.createdOn.seconds);   // sorted in descending order
            // console.log(blogs);

            // setBlogs(blogs);
            dispatch({type:"Reload" , all_blogs:blogs });
        }

        fetchData();
    },[]);

    async function handleSubmit(e){
        e.preventDefault();

        if(updateIndex!==-1){
            alert('first update the blog you are trying to update then only you can add new blog')
            return; // in this case user is trying to update blog and at the same time he is adding new blog which will create problem
        }

        if(!formData.content.trim()){  // length of trimed string need to be greater than 0.(required attribute never handles empty strings with length greate than 0)
            alert('Content is required.');
            return;
        }
        // setBlogs([{title: formData.title, content: formData.content}, ...blogs]);  
        dispatch({type:"Add Blog" , blog:{title: formData.title, content: formData.content} });

        // Add a new document with a generated id.

        await addDoc(collection(db, "blogs"), {
            title: formData.title,
            content: formData.content,
            createdOn: new Date()
        }); 

        // const newCityRef = doc(collection(db, "blogs"));  // or use setDoc() : (setDoc is generally used to set the doc. but here used to add the doc. )
        // await setDoc(newCityRef, {
        //         title: formData.title,
        //         content: formData.content,
        //         createdOn: new Date()
        // });

        
        setFormData({title: "" , content: ""})

        titleRef.current.focus(); // focus goes onto title field of input form when app re-renders

        // creating reference(newBlogRef) to newBlog that use wants to add
        const newBlogRef = createRef();  // cannot use useRef inside function (can use inside a react hook)
        contentRefs.push(newBlogRef);  
        setContentRefs([...contentRefs]);  // creates a new array with the same refs that are in contentRefs. It's using the spread operator [...contentRefs] to create a shallow copy of the array. 

        console.log(blogs); // prints previous state as dispatch(& setBlogs) is asynchronous fun. so blog is added inside blogs array after console.log() executes
    }

    function removeBlog(i){
        // setBlogs(blogs.filter((blog,index)=> i!==index));
        dispatch({type:"Remove Blog", index:i});
    }


    // code to update the blog :- 
    function updateBlog(i) {
        setUpdateIndex(i);
        setUpdatedTitle(blogs[i].title);
        setUpdatedContent(blogs[i].content); // Set the Updated content to blogs[i].content 

        setTimeout(() => {
            contentRefs[i].current.focus(); // Set focus to the content field of the specific blog
        }, 0);  
        // if not used setTimeout & tries to set focus using contentRefs[i].current.focus() immediately after clicking the "Update" button, then focus will not be set
        // cause React might not have updated/rendered DOM or not updated state yet cause browser's rendering and state updates are asynchronous.
        // hence setTimeout with a delay of 0 allows you to schedule the focus after the current rendering cycle / state update is complete  
    }

    function handleContentChange(e) {
        if(e.target.className==="input title"){
            setUpdatedTitle(e.target.value);
        }else{
            setUpdatedContent(e.target.value);  // Set the updated content to e.target.value (i.e update value of updatedContent as user types) 
        }
    }
    
    function saveChanges(updatedContent,i){
        if(updatedContent.trim()){
            dispatch({ type: 'Update Blog', index: i, new_content: updatedContent , new_title: updatedTitle });
            setUpdateIndex(-1);
        }else{
            // console.log('updatedContent',updatedContent,typeof(updatedContent),updatedContent.length,updatedContent.trim().length);
            alert('Content is required.');
            setTimeout(() => {
                contentRefs[i].current.focus(); // Set focus to the content field of  blog
            }, 0);  
            return;
        }
    }

    function cancleChanges(i){
        dispatch({ type: 'Update Blog', index: i, new_content: blogs[i].content , new_title: blogs[i].title });
        titleRef.current.focus();
        setUpdateIndex(-1);
    }


    return(
        <>
        <h1>Write a Blog!</h1>
        <div className="section">

        {/* Form for to write the blog */}
            <form onSubmit={handleSubmit}>
                <Row label="Title">
                        <input className="input title"
                                placeholder="Enter the title of the blog here.."
                                value={formData.title}
                                ref = {titleRef}
                                onChange = {(e) =>  e.target.value.length<30 ? setFormData({title : e.target.value , content: formData.content}) : alert('Size of title need to be less than 30')}
                        />
                </Row >

                <Row label="Content">
                        <textarea className="input content"
                                placeholder="Content of the Blog goes here.."
                                value={formData.content}
                                onChange = {(e) => setFormData({title : formData.title , content : e.target.value})}
                                required //without content blog cannot exists 
                        />
                </Row >
         
                <button className = "btn">ADD</button>
            </form>  
        </div>

        <hr/>

        {/* Section where submitted blogs will be displayed */}
        <h2> Blogs </h2>
        {blogs.map((blog,i) => (
            <div className="blog" key={i}>

                <div className="blog-btn">
                    {updateIndex === i ? null: 
                    <button onClick={()=>updateBlog(i)} className="btn update">
                        Update
                    </button>}
                </div>

                {/* <h3>{blog.title}</h3> */}
                <input style={{marginTop:'10px'}}
                    type="text"
                    className="input title"
                    placeholder="Enter title for blog..."
                    value={updateIndex===i ? updatedTitle : blog.title}
                    onChange={(e) => e.target.value.length<30 ? handleContentChange(e) : alert('Size of title need to be less than 30')}
                    disabled={updateIndex !== i ? true : false}  // user cannot modify title if he has not clicked on update button
                />
                <hr/>

                {/* <p>{blog.content}</p> */}
                <textarea
                    className="input content"
                    placeholder="Content of the Blog goes here.."
                    value={updateIndex === i ? updatedContent : blog.content}
                    onChange={(e) => handleContentChange(e)}
                    ref={contentRefs[i]} // added reference to content of blog here
                    disabled={updateIndex !== i ? true : false}
                    required
                />

                <div className="blog-btn">
                    {updateIndex === i ? 
                    <div className="btn-container">
                        <div style={{ width: '60px', marginRight:'20px'}}>
                            <button onClick={()=>saveChanges(updatedContent,i)} className="btn update">
                                Save
                            </button>
                        </div>
                        <div style={{ width: '60px'}}>
                            <button onClick={()=>cancleChanges(i)} className="btn remove" >
                                Cancle
                            </button>
                        </div>
                    </div>
                    : 
                    <button onClick={()=>removeBlog(i)} className="btn remove">
                        Delete
                    </button>}
                </div>

            </div>
        ))}
        
        </>
        )
    }

//Row component to introduce a new row section in the form
function Row(props){
    const{label} = props;
    return(
        <>
        <label>{label}<br/></label>
        {props.children}
        <hr />
        </>
    )
}
