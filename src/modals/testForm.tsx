import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TestFormSchema, type TestFormData } from "../schema/schema";

const TestForm = () => {
  const [vehicles, setVehicles] = useState<
    { id: string; plate_no: string; model: string; type: string }[]
  >([]);
  const [selectedImage, setSelectedImage] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors},
  } = useForm({
    resolver: zodResolver(TestFormSchema),
  });



  const fileChange = (event:React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if(!files.length) return;
    const imageUrl = files.map((file) => URL.createObjectURL(file))
    setSelectedImage(prev => {
      prev.forEach(url => URL.revokeObjectURL(url))
      return imageUrl
    })
  } 


  useEffect(() => {
    return () => {
      selectedImage.forEach(url => URL.revokeObjectURL(url))
    }
  },[selectedImage])

const selectedPlate = watch("plate_no")
const uploadFile = async (file: File, bucket: string, folder?:string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) throw error;
  const {data} = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl
}

  const onSubmit = async (data:TestFormData) => {
    try {
      const files = data.valid_id

      if(!files || files.length === 0){
        console.log('No Selected Images')
      }

      const validIdUrl = await Promise.all(
        Array.from(files).map(file => uploadFile(file, "valid_id"))
      )

      const {data: renter, error} = await supabase.from("test").insert({
        full_name: data.full_name,
        valid_id: validIdUrl,
        plate_no : data.plate_no,
        car_model : data.car_model,
        car_type: data.car_type,
      })

      if(error) {
        console.log('Error Submitting',error)
        return
      }
      console.log('Submit Sucessfully',renter)

    }catch(err) {
        console.log(err)
    }
  
  }

  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicle")
        .select("id, plate_no, model, type");
      if (error) {
        console.log("Error Fetchiong Vehicle", error);
        return;
      }
      console.log("Fetching Vehicle Successfully", data);
      setVehicles(data);
    };
    fetchVehicle();
  }, []);

  useEffect(() => {
      if(!selectedPlate) {
        setValue("car_model", "")
        setValue("car_type", "")
      }
      const selectedVehicle = vehicles.find((v) => v.plate_no === selectedPlate)

      if(selectedVehicle) {
        setValue("car_model", selectedVehicle.model)
        setValue("car_type", selectedVehicle.type)
      }

  },[selectedPlate, vehicles, setValue])
  return (
    <form onSubmit={handleSubmit(onSubmit)} action="" className="flex flex-col">
      <div>
        <div>
          <label htmlFor="">Full Name</label>
          <input
          {...register('full_name')}
            type="text"
            placeholder="fullname"
            className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
          />
          {errors.full_name?.message}
        </div>
        <div>
          <label htmlFor="">Valid Id</label>
          <input
          {...register("valid_id",{
            onChange:fileChange
          })
          }
            type="file"
            multiple
            placeholder="fullname"
            className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
          />
          <div className="flex">
              {selectedImage.map((url,index) => (
          <img  key={index} alt=""  src={url} width={200} height={200}/>
          ))}
          </div>
        </div>

        <div>
          <select
          {...register("plate_no")}
          >
            <option className="txt-color">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.plate_no}>
                {vehicle.plate_no}
              </option>
            ))}
          </select>
          <input
            {...register("car_model")}
            type="text"
            placeholder="model"
            className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
          />
          <input
            {...register("car_type")}
            type="text"
            placeholder="type"
            className="border py-4 px-4 border-gray-400 rounded placeholder-gray-400 "
          />
        </div>
      </div>
      <button type="submit">Add</button>
    </form>
  );
};

export default TestForm;
