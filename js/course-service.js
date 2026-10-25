window.courseService = {
  async list() {
    const {data, error} = await studyClient.from('courses').select('*').order('created_at');
    if (error) throw error;
    return data;
  },
  async create(userId, values) {
    const {data, error} = await studyClient.from('courses')
      .insert({...values, user_id:userId}).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, values) {
    const {data, error} = await studyClient.from('courses')
      .update(values).eq('id',id).select().single();
    if (error) throw error;
    return data;
  }
};
