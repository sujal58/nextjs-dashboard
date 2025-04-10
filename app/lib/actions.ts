'use server';

import {z} from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


const sql = postgres(process.env.POSTGRES_URL!);

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
    date: z.string()
})

const CreateInvoice = FormSchema.omit({id:true, date:true});
const UpdateInvoice = FormSchema.omit({id:true, date:true});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};


export async function createInvoice(prevState: State, formData:FormData){

    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status")
    })

    console.log(validatedFields.data );
    console.log(validatedFields.error );
    console.log(validatedFields.success );


    // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const {customerId, amount, status} = validatedFields.data;

    //always store the price value in cents i.e lowestvalue

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        
        await sql`INSERT INTO invoices (customer_id, amount, status, date)
                VALUES(${customerId}, ${amountInCents}, ${status}, ${date})`;
                revalidatePath("/dashboard/invoices");
    } catch (error) {
        console.log(error);
    }

    redirect('/dashboard/invoices');


}


export async function updateInvoice(id:string,prevState:State, formdata:FormData){
    const validatedField = UpdateInvoice.safeParse({
        customerId: formdata.get("customerId"),
        amount: formdata.get('amount'),
        status: formdata.get('status')
    })

    if(!validatedField.success){
      return{
        errors: validatedField.error.flatten().fieldErrors,
        message: 'Missing fields . Failed to update invoices.'

      }
    }

    const {customerId, amount, status}  = validatedField.data;

    const amountInCents = amount * 100;
    try{

        await sql`UPDATE invoices
                    SET customer_id = ${customerId}, amount= ${amountInCents}, status= ${status}
                        WHERE id = ${id}`;
    
        revalidatePath('/dashboard/invoices');
     
    }catch(err){
        console.log(err);
    }
      redirect('/dashboard/invoices')
}


export async function deleteInvoices(id:string){
      throw new Error('Failed to Delete Invoice');

    try {
        await sql`delete from invoices
                    where id = ${id}`;
        revalidatePath('/dashboard/invoices');
    } catch (error) {
        console.log(error);
    }
    
}
